import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ParkQR Backend API',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  @Get('db')
  async checkDatabase() {
    // Este endpoint puede ser usado para verificar la conexión a la base de datos
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    };
  }
}