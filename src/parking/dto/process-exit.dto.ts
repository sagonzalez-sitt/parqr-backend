import { IsString, IsNotEmpty } from 'class-validator';

export class ProcessExitDto {
  @IsString()
  @IsNotEmpty()
  qrToken: string;
}