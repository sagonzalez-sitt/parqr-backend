import { Controller, Get, Post, Body, Param, UseGuards, Res } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { ParkingService } from './parking.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { ProcessExitDto } from './dto/process-exit.dto';

@Controller('parking')
@UseGuards(ThrottlerGuard)
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  @Post('entry')
  async createEntry(@Body() createEntryDto: CreateEntryDto) {
    return this.parkingService.createEntry(createEntryDto);
  }

  @Get('ticket/:qrToken')
  async getTicket(@Param('qrToken') qrToken: string) {
    return this.parkingService.getTicketByToken(qrToken);
  }

  @Post('exit')
  async processExit(@Body() processExitDto: ProcessExitDto) {
    return this.parkingService.processExit(processExitDto);
  }

  @Get('status')
  async getParkingStatus() {
    return this.parkingService.getParkingStatus();
  }

  @Get('tickets')
  async getAllTickets() {
    return this.parkingService.getAllTickets();
  }

  @Get('tickets/:id')
  async getTicketById(@Param('id') id: string) {
    return this.parkingService.getTicketById(id);
  }

  // NUEVOS ENDPOINTS PARA SISTEMA HÍBRIDO
  @Post('confirm-digital/:token')
  async confirmDigital(@Param('token') token: string) {
    return this.parkingService.confirmDigitalDelivery(token);
  }

  @Post('mark-printed/:token')
  async markPrinted(@Param('token') token: string) {
    return this.parkingService.markAsPrinted(token);
  }

  @Get('ticket/:token/image')
  async downloadTicketImage(@Param('token') token: string, @Res() res: Response) {
    const imageBuffer = await this.parkingService.generateTicketImage(token);
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="ticket-${token}.png"`,
      'Content-Length': imageBuffer.length,
    });
    
    res.send(imageBuffer);
  }
}