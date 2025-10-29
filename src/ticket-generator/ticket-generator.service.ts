import { Injectable } from '@nestjs/common';
import { createCanvas, loadImage } from 'canvas';
import * as QRCode from 'qrcode';

@Injectable()
export class TicketGeneratorService {
  async generateTicketImage(ticketData: {
    qrToken: string;
    plateNumber: string;
    vehicleType: string;
    entryTimestamp: Date;
    verifyUrl: string;
  }): Promise<Buffer> {
    // Crear canvas de 600x800px
    const canvas = createCanvas(600, 800);
    const ctx = canvas.getContext('2d');

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 800);

    // Título
    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TICKET DE PARQUEADERO', 300, 60);

    // Línea separadora
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 80);
    ctx.lineTo(550, 80);
    ctx.stroke();

    // Información del vehículo
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('PLACA:', 50, 130);
    
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(ticketData.plateNumber, 150, 130);

    ctx.fillStyle = '#374151';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('TIPO:', 50, 170);
    ctx.fillText(this.getVehicleTypeLabel(ticketData.vehicleType), 120, 170);

    ctx.fillText('ENTRADA:', 50, 210);
    ctx.fillText(this.formatDateTime(ticketData.entryTimestamp), 150, 210);

    // Generar QR code
    const qrDataUrl = await QRCode.toDataURL(ticketData.verifyUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Cargar y dibujar QR
    const qrImage = await loadImage(qrDataUrl);
    ctx.drawImage(qrImage, 150, 250, 300, 300);

    // Instrucciones
    ctx.fillStyle = '#6b7280';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ESCANEA ESTE CÓDIGO AL SALIR', 300, 580);
    ctx.fillText('O MUESTRA ESTA IMAGEN', 300, 610);

    // Token (para referencia)
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px monospace';
    ctx.fillText(`Token: ${ticketData.qrToken}`, 300, 650);

    // Información adicional
    ctx.fillStyle = '#374151';
    ctx.font = '14px Arial';
    ctx.fillText('Conserve este ticket hasta su salida', 300, 690);
    ctx.fillText('Tarifas: Carro $2.00/h | Moto $1.00/h | Bici $0.50/h', 300, 720);

    // Línea inferior
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 750);
    ctx.lineTo(550, 750);
    ctx.stroke();

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Arial';
    ctx.fillText('Sistema de Parqueadero - Generado automáticamente', 300, 780);

    return canvas.toBuffer('image/png');
  }

  private getVehicleTypeLabel(type: string): string {
    const labels = {
      CAR: 'Carro',
      MOTORCYCLE: 'Moto',
      BICYCLE: 'Bicicleta',
    };
    return labels[type as keyof typeof labels] || type;
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }
}