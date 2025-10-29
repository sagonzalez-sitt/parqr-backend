#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración para despliegue en Vercel...\n');

const checks = [
  {
    name: 'vercel.json existe',
    check: () => fs.existsSync('vercel.json'),
    fix: 'Crear archivo vercel.json con la configuración necesaria'
  },
  {
    name: 'api/index.ts existe',
    check: () => fs.existsSync('api/index.ts'),
    fix: 'Crear archivo api/index.ts como punto de entrada para Vercel'
  },
  {
    name: '.vercelignore existe',
    check: () => fs.existsSync('.vercelignore'),
    fix: 'Crear archivo .vercelignore para excluir archivos innecesarios'
  },
  {
    name: 'package.json tiene script vercel-build',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts && pkg.scripts['vercel-build'];
    },
    fix: 'Agregar script "vercel-build" al package.json'
  },
  {
    name: 'package.json tiene script postinstall',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts && pkg.scripts['postinstall'];
    },
    fix: 'Agregar script "postinstall" al package.json'
  },
  {
    name: 'Prisma schema existe',
    check: () => fs.existsSync('prisma/schema.prisma'),
    fix: 'Asegurarse de que el archivo prisma/schema.prisma existe'
  },
  {
    name: '.env.example existe',
    check: () => fs.existsSync('.env.example'),
    fix: 'Crear archivo .env.example con las variables de entorno necesarias'
  }
];

let allPassed = true;

checks.forEach(({ name, check, fix }) => {
  const passed = check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  
  if (!passed) {
    console.log(`   💡 ${fix}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 ¡Todo listo para desplegar en Vercel!');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Conectar repositorio a Vercel');
  console.log('2. Configurar variables de entorno:');
  console.log('   - DATABASE_URL');
  console.log('   - FRONTEND_URL');
  console.log('   - NODE_ENV=production');
  console.log('3. Desplegar');
} else {
  console.log('⚠️  Hay problemas que necesitan ser resueltos antes del despliegue.');
  process.exit(1);
}

console.log('\n📖 Para más información, consulta VERCEL_DEPLOYMENT.md');