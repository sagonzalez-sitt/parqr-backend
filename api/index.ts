import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express from 'express';

let app: any;

export default async function handler(req: any, res: any) {
  // Handle CORS manually for preflight requests
  const allowedOrigins = [
    'http://localhost:3000',
    'https://parqr-frontend.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!app) {
    try {
      const server = express();

      app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(server),
        {
          logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug', 'verbose']
        }
      );

      // Enable CORS
      app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      });

      // Global validation pipe
      app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }));

      // Global prefix
      app.setGlobalPrefix('api');

      await app.init();

      console.log('✅ NestJS app initialized for Vercel');
    } catch (error) {
      console.error('❌ Error initializing NestJS app:', error);
      res.status(500).json({ error: 'Failed to initialize application', details: error.message });
      return;
    }
  }

  try {
    return app.getHttpAdapter().getInstance()(req, res);
  } catch (error) {
    console.error('❌ Error handling request:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}