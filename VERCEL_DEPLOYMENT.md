# Despliegue en Vercel - Backend ParkQR

## Configuración de Variables de Entorno

Antes de desplegar, configura las siguientes variables de entorno en Vercel:

### Variables Requeridas:

1. **DATABASE_URL**
   ```
   postgresql://username:password@host:port/database?schema=public
   ```
   - Usa una base de datos PostgreSQL en la nube (Railway, Supabase, Neon, etc.)

2. **FRONTEND_URL**
   ```
   https://tu-frontend.vercel.app
   ```
   - URL de tu frontend desplegado

3. **NODE_ENV**
   ```
   production
   ```

### Variables Opcionales:

4. **CAR_RATE** (default: 200)
   ```
   200
   ```
   - Tarifa por hora para carros en centavos

5. **MOTORCYCLE_RATE** (default: 100)
   ```
   100
   ```
   - Tarifa por hora para motos en centavos

6. **BICYCLE_RATE** (default: 50)
   ```
   50
   ```
   - Tarifa por hora para bicicletas en centavos

## Pasos para Desplegar:

1. **Conecta tu repositorio a Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio del backend
   - Selecciona la carpeta `backend` como directorio raíz

2. **Configura las variables de entorno**
   - En el dashboard de Vercel, ve a Settings > Environment Variables
   - Agrega todas las variables listadas arriba

3. **Configura la base de datos**
   - Asegúrate de que tu base de datos PostgreSQL esté accesible desde internet
   - Ejecuta las migraciones de Prisma si es necesario

4. **Despliega**
   - Vercel detectará automáticamente la configuración
   - El build se ejecutará usando `npm run vercel-build`

## Estructura de Archivos para Vercel:

```
backend/
├── api/
│   └── index.ts          # Punto de entrada para Vercel
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   └── ...
├── prisma/
│   └── schema.prisma
├── vercel.json           # Configuración de Vercel
├── .vercelignore         # Archivos a ignorar
└── package.json
```

## Endpoints Disponibles:

Una vez desplegado, tu API estará disponible en:
- `https://tu-backend.vercel.app/api/parking/entry` - Crear entrada
- `https://tu-backend.vercel.app/api/parking/exit` - Procesar salida
- `https://tu-backend.vercel.app/api/parking/status` - Estado del parqueadero
- `https://tu-backend.vercel.app/api/parking/tickets` - Listar tickets

## Notas Importantes:

1. **Funciones Serverless**: Vercel usa funciones serverless, por lo que cada request puede tener un cold start
2. **Timeout**: Las funciones tienen un timeout máximo de 30 segundos
3. **Base de datos**: Asegúrate de usar connection pooling en tu base de datos
4. **CORS**: El backend está configurado para aceptar requests del frontend
5. **Prisma**: Se genera automáticamente durante el build

## Troubleshooting:

- Si hay errores de build, revisa los logs en Vercel
- Asegúrate de que todas las variables de entorno estén configuradas
- Verifica que la base de datos sea accesible desde Vercel
- Los archivos de migración de Prisma deben estar incluidos en el repositorio