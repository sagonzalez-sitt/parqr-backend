import { Module } from '@nestjs/common';
import { ParkingController } from './parking.controller';
import { ParkingService } from './parking.service';
import { QrService } from './qr.service';
import { TicketGeneratorModule } from '../ticket-generator/ticket-generator.module';

@Module({
  imports: [TicketGeneratorModule],
  controllers: [ParkingController],
  providers: [ParkingService, QrService],
})
export class ParkingModule {}