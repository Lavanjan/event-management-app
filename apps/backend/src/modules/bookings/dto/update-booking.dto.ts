import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { CreateBookingDto } from './create-booking.dto';
import { BookingStatus, PaymentStatus } from '../../../database/entities/booking.entity';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsNumber()
  advanceAmount?: number;

  @IsOptional()
  @IsBoolean()
  useCustomAdvance?: boolean;
}
