import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express, { Request, Response } from 'express';

// Extend global to include our app instance
declare global {
  var __app: express.Application | undefined;
}

const server = express();

export default async (req: Request, res: Response) => {
  if (!global.__app) {
    try {
      const app = await NestFactory.create(
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
      global.__app = app.getHttpAdapter().getInstance();
      
      console.log('✅ NestJS app initialized for Vercel');
    } catch (error) {
      console.error('❌ Error initializing NestJS app:', error);
      throw error;
    }
  }

  return global.__app(req, res);
};