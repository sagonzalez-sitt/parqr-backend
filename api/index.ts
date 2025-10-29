import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import express from 'express';
import cors from 'cors';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Crear la aplicación Express
const app = express();

// Middlewares básicos
app.use(cors({
  credentials: true,
  origin: [
    'http://localhost:3000',
    'https://parqr-frontend.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean)
}));

app.use(express.json());

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'Parking Management API'
  });
});

// Variables para controlar la inicialización
let nestApp: any = null;
let dbConnected = false;

// Función para conectar a la base de datos
const connectDB = async () => {
  if (!dbConnected) {
    try {
      // Verificar que la URL de la base de datos esté presente
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
      }
      
      console.log('✅ Database configuration verified');
      dbConnected = true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }
};

// Función para inicializar NestJS
const initializeNestApp = async () => {
  if (!nestApp) {
    try {
      console.log('🚀 Initializing NestJS application...');
      
      // Crear la aplicación NestJS con Express adapter
      nestApp = await NestFactory.create(
        AppModule,
        new ExpressAdapter(app),
        {
          logger: process.env.NODE_ENV === 'production' 
            ? ['error', 'warn'] 
            : ['log', 'error', 'warn', 'debug', 'verbose']
        }
      );

      // Configurar CORS en NestJS
      nestApp.enableCors({
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
      nestApp.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }));

      // Set global prefix
      nestApp.setGlobalPrefix('api');

      // Inicializar la aplicación
      await nestApp.init();
      
      console.log('✅ NestJS application initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize NestJS application:', error);
      nestApp = null;
      throw error;
    }
  }
};

// Handler principal para Vercel
export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Conectar a la base de datos
    await connectDB();
    
    // Inicializar NestJS si no está inicializado
    await initializeNestApp();
    
    // Pasar la request y response a Express
    return app(req as any, res as any);
    
  } catch (error) {
    console.error('❌ Error in serverless function:', error);
    
    // Reset en caso de error
    nestApp = null;
    dbConnected = false;
    
    return res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};