import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        origin: [
          'http://localhost:3000',
          'https://parqr-frontend.vercel.app',
          process.env.FRONTEND_URL
        ].filter(Boolean),
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