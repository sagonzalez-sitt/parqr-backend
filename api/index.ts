import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  try {
    // Set CORS headers first
    const allowedOrigins = [
      'http://localhost:3000',
      'https://parqr-frontend.vercel.app'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Initialize app if not cached
    if (!cachedApp) {
      console.log('🚀 Initializing NestJS app...');
      
      cachedApp = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log']
      });

      // Configure CORS
      cachedApp.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      });

      // Global validation
      cachedApp.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }));

      // Set global prefix
      cachedApp.setGlobalPrefix('api');

      await cachedApp.init();
      console.log('✅ NestJS app initialized successfully');
    }

    // Handle the request
    const expressApp = cachedApp.getHttpAdapter().getInstance();
    return expressApp(req, res);

  } catch (error) {
    console.error('❌ Handler error:', error);
    
    // Reset cached app on error
    cachedApp = null;
    
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}