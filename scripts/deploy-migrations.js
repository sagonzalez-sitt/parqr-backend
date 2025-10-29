#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔄 Ejecutando migraciones de Prisma para producción...');

try {
  // Generar cliente de Prisma
  console.log('📦 Generando cliente de Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Aplicar migraciones (solo si hay migraciones pendientes)
  console.log('🗄️ Aplicando migraciones de base de datos...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('✅ Migraciones completadas exitosamente');
} catch (error) {
  console.error('❌ Error ejecutando migraciones:', error.message);
  process.exit(1);
}