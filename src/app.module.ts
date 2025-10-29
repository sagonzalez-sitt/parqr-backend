import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ParkingModule } from './parking/parking.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),
    DatabaseModule,
    ParkingModule,
    HealthModule,
  ],
})
export class AppModule {}