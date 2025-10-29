import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { QrService } from './qr.service';
import { TicketGeneratorService } from '../ticket-generator/ticket-generator.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { ProcessExitDto } from './dto/process-exit.dto';
import { VehicleType, TicketStatus, TicketDeliveryMethod } from '@prisma/client';

@Injectable()
export class ParkingService {
  constructor(
    private prisma: PrismaService,
    private qrService: QrService,
    private ticketGeneratorService: TicketGeneratorService,
  ) {}

  async createEntry(createEntryDto: CreateEntryDto) {
    const { plateNumber, vehicleType } = createEntryDto;

    // Verificar si ya existe un ticket activo para esta placa
    const existingTicket = await this.prisma.parkingTicket.findFirst({
      where: {
        plateNumber: plateNumber.toUpperCase(),
        status: TicketStatus.ACTIVE,
      },
    });

    if (existingTicket) {
      throw new BadRequestException('Ya existe un ticket activo para esta placa');
    }

    // Generar token único
    const qrToken = this.qrService.generateToken();
    
    // Crear el ticket
    const ticket = await this.prisma.parkingTicket.create({
      data: {
        qrToken,
        plateNumber: plateNumber.toUpperCase(),
        vehicleType,
        entryTimestamp: new Date(),
        status: TicketStatus.ACTIVE,
      },
    });

    // Generar QR code
    const qrCodeDataUrl = await this.qrService.generateQRCode(qrToken);
    const verifyUrl = this.qrService.getVerifyUrl(qrToken);

    return {
      ticket: {
        id: ticket.id,
        qrToken: ticket.qrToken,
        plateNumber: ticket.plateNumber,
        vehicleType: ticket.vehicleType,
        entryTimestamp: ticket.entryTimestamp,
      },
      qrCode: qrCodeDataUrl,
      verifyUrl,
    };
  }

  async getTicketByToken(qrToken: string) {
    const ticket = await this.prisma.parkingTicket.findUnique({
      where: { qrToken },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const currentTime = new Date();
    const timeElapsed = Math.floor((currentTime.getTime() - ticket.entryTimestamp.getTime()) / 1000 / 60); // minutos
    const estimatedFee = this.calculateFee(ticket.vehicleType, timeElapsed);

    return {
      ticket: {
        id: ticket.id,
        plateNumber: ticket.plateNumber,
        vehicleType: ticket.vehicleType,
        entryTimestamp: ticket.entryTimestamp,
        exitTimestamp: ticket.exitTimestamp,
        status: ticket.status,
        calculatedFee: ticket.calculatedFee,
      },
      timeElapsed,
      estimatedFee: ticket.status === TicketStatus.ACTIVE ? estimatedFee : ticket.calculatedFee,
    };
  }

  async processExit(processExitDto: ProcessExitDto) {
    const { qrToken } = processExitDto;

    const ticket = await this.prisma.parkingTicket.findUnique({
      where: { qrToken },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException('Este ticket ya fue procesado');
    }

    const exitTimestamp = new Date();
    const timeElapsed = Math.floor((exitTimestamp.getTime() - ticket.entryTimestamp.getTime()) / 1000 / 60); // minutos
    const totalFee = this.calculateFee(ticket.vehicleType, timeElapsed);

    const updatedTicket = await this.prisma.parkingTicket.update({
      where: { qrToken },
      data: {
        exitTimestamp,
        calculatedFee: totalFee,
        status: TicketStatus.COMPLETED,
      },
    });

    return {
      ticket: {
        id: updatedTicket.id,
        plateNumber: updatedTicket.plateNumber,
        vehicleType: updatedTicket.vehicleType,
        entryTimestamp: updatedTicket.entryTimestamp,
        exitTimestamp: updatedTicket.exitTimestamp,
        calculatedFee: updatedTicket.calculatedFee,
      },
      timeElapsed,
      totalMinutes: timeElapsed,
      totalHours: Math.ceil(timeElapsed / 60),
    };
  }

  async getParkingStatus() {
    const activeTickets = await this.prisma.parkingTicket.findMany({
      where: { status: TicketStatus.ACTIVE },
      orderBy: { entryTimestamp: 'desc' },
    });

    const totalActive = activeTickets.length;
    const vehicleTypeCounts = activeTickets.reduce((acc, ticket) => {
      acc[ticket.vehicleType] = (acc[ticket.vehicleType] || 0) + 1;
      return acc;
    }, {} as Record<VehicleType, number>);

    // Estadísticas del día
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = await this.prisma.parkingTicket.aggregate({
      where: {
        entryTimestamp: {
          gte: today,
        },
      },
      _count: true,
      _sum: {
        calculatedFee: true,
      },
    });

    return {
      activeVehicles: totalActive,
      vehicleTypeCounts,
      activeTickets: activeTickets.map(ticket => ({
        id: ticket.id,
        plateNumber: ticket.plateNumber,
        vehicleType: ticket.vehicleType,
        entryTimestamp: ticket.entryTimestamp,
        timeElapsed: Math.floor((new Date().getTime() - ticket.entryTimestamp.getTime()) / 1000 / 60),
      })),
      todayStats: {
        totalEntries: todayStats._count,
        totalRevenue: todayStats._sum.calculatedFee || 0,
      },
    };
  }

  async getAllTickets() {
    const tickets = await this.prisma.parkingTicket.findMany({
      orderBy: { entryTimestamp: 'desc' },
    });

    return tickets.map(ticket => ({
      id: ticket.id,
      qrToken: ticket.qrToken,
      plateNumber: ticket.plateNumber,
      vehicleType: ticket.vehicleType,
      entryTimestamp: ticket.entryTimestamp,
      exitTimestamp: ticket.exitTimestamp,
      calculatedFee: ticket.calculatedFee,
      status: ticket.status,
      timeElapsed: ticket.exitTimestamp 
        ? Math.floor((ticket.exitTimestamp.getTime() - ticket.entryTimestamp.getTime()) / 1000 / 60)
        : Math.floor((new Date().getTime() - ticket.entryTimestamp.getTime()) / 1000 / 60),
    }));
  }

  async getTicketById(id: string) {
    const ticket = await this.prisma.parkingTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const currentTime = new Date();
    const timeElapsed = ticket.exitTimestamp
      ? Math.floor((ticket.exitTimestamp.getTime() - ticket.entryTimestamp.getTime()) / 1000 / 60)
      : Math.floor((currentTime.getTime() - ticket.entryTimestamp.getTime()) / 1000 / 60);
    
    const estimatedFee = ticket.status === TicketStatus.COMPLETED 
      ? ticket.calculatedFee 
      : this.calculateFee(ticket.vehicleType, timeElapsed);

    return {
      ticket: {
        id: ticket.id,
        qrToken: ticket.qrToken,
        plateNumber: ticket.plateNumber,
        vehicleType: ticket.vehicleType,
        entryTimestamp: ticket.entryTimestamp,
        exitTimestamp: ticket.exitTimestamp,
        status: ticket.status,
        calculatedFee: ticket.calculatedFee,
      },
      timeElapsed,
      estimatedFee,
    };
  }

  private calculateFee(vehicleType: VehicleType, minutes: number): number {
    const rates = {
      [VehicleType.CAR]: parseInt(process.env.CAR_RATE || '200', 10), // 200 centavos por hora
      [VehicleType.MOTORCYCLE]: parseInt(process.env.MOTORCYCLE_RATE || '100', 10), // 100 centavos por hora
      [VehicleType.BICYCLE]: parseInt(process.env.BICYCLE_RATE || '50', 10), // 50 centavos por hora
    };

    const hours = Math.ceil(minutes / 60); // Redondear hacia arriba
    const ratePerHour = rates[vehicleType];
    
    return hours * ratePerHour; // Retorna en centavos
  }

  // NUEVOS MÉTODOS PARA SISTEMA HÍBRIDO
  async confirmDigitalDelivery(qrToken: string) {
    const ticket = await this.prisma.parkingTicket.findUnique({
      where: { qrToken },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const updatedTicket = await this.prisma.parkingTicket.update({
      where: { qrToken },
      data: {
        deliveryMethod: TicketDeliveryMethod.DIGITAL_PHOTO,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Ticket marcado como foto digital',
      deliveryMethod: updatedTicket.deliveryMethod,
    };
  }

  async markAsPrinted(qrToken: string) {
    const ticket = await this.prisma.parkingTicket.findUnique({
      where: { qrToken },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const updatedTicket = await this.prisma.parkingTicket.update({
      where: { qrToken },
      data: {
        deliveryMethod: TicketDeliveryMethod.PRINTED,
        printedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Ticket marcado como impreso',
      deliveryMethod: updatedTicket.deliveryMethod,
      printedAt: updatedTicket.printedAt,
    };
  }

  async generateTicketImage(qrToken: string): Promise<Buffer> {
    const ticket = await this.prisma.parkingTicket.findUnique({
      where: { qrToken },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    // Marcar como descargado
    await this.prisma.parkingTicket.update({
      where: { qrToken },
      data: {
        deliveryMethod: TicketDeliveryMethod.DIGITAL_DOWNLOAD,
        qrDownloadedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const verifyUrl = this.qrService.getVerifyUrl(qrToken);

    return this.ticketGeneratorService.generateTicketImage({
      qrToken: ticket.qrToken,
      plateNumber: ticket.plateNumber,
      vehicleType: ticket.vehicleType,
      entryTimestamp: ticket.entryTimestamp,
      verifyUrl,
    });
  }
}