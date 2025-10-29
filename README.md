# Backend - Sistema de Parqueadero

API REST desarrollada con NestJS para el sistema de gestión de parqueadero con códigos QR.

## Tecnologías

- **NestJS** - Framework de Node.js
- **TypeScript** - Lenguaje de programación
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **QRCode** - Generación de códigos QR
- **Nanoid** - Generación de tokens únicos

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

3. Configurar la base de datos PostgreSQL y actualizar `DATABASE_URL` en `.env`

4. Ejecutar migraciones de Prisma:
```bash
npm run prisma:push
```

5. Generar cliente de Prisma:
```bash
npm run prisma:generate
```

## Desarrollo

```bash
# Modo desarrollo
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

## API Endpoints

### POST /api/parking/entry
Crear entrada de vehículo y generar QR.

**Body:**
```json
{
  "plateNumber": "ABC123",
  "vehicleType": "CAR"
}
```

### GET /api/parking/ticket/:qrToken
Obtener información del ticket por token QR.

### POST /api/parking/exit
Procesar salida de vehículo.

**Body:**
```json
{
  "qrToken": "token_del_qr"
}
```

### GET /api/parking/status
Obtener estado actual del parqueadero y estadísticas.

## Base de Datos

El esquema incluye una tabla principal `parking_tickets` con:
- Información del vehículo (placa, tipo)
- Timestamps de entrada y salida
- Token QR único
- Estado del ticket
- Tarifa calculada

## Configuración

Variables de entorno importantes:
- `DATABASE_URL` - Conexión a PostgreSQL
- `PORT` - Puerto del servidor (default: 3001)
- `FRONTEND_URL` - URL del frontend para CORS y QR
- `CAR_RATE`, `MOTORCYCLE_RATE`, `BICYCLE_RATE` - Tarifas por hora en centavos