import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { nanoid } from 'nanoid';

@Injectable()
export class QrService {
  generateToken(): string {
    return nanoid(16); // Genera un token único de 16 caracteres
  }

  async generateQRCode(token: string): Promise<string> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify/${token}`;
    
    try {
      // Genera el QR como data URL (base64)
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrDataUrl;
    } catch (error) {
      throw new Error('Error generando código QR');
    }
  }

  getVerifyUrl(token: string): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${frontendUrl}/verify/${token}`;
  }
}