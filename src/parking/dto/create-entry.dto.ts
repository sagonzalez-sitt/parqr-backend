import { IsEnum, IsString, IsNotEmpty, Matches } from 'class-validator';
import { VehicleType } from '@prisma/client';

export class CreateEntryDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9-]{3,10}$/, {
    message: 'Placa debe contener solo letras mayúsculas, números y guiones (3-10 caracteres)'
  })
  plateNumber: string;

  @IsEnum(VehicleType)
  vehicleType: VehicleType;
}