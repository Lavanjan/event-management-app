import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BookingPaymentStatus } from '../../../database/entities';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class BookingFiltersDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by payment status',
    enum: BookingPaymentStatus,
    isArray: true,
    example: [BookingPaymentStatus.PENDING, BookingPaymentStatus.ADVANCE_PAID],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(status => status.trim());
    }
    return value;
  })
  @IsArray()
  @IsEnum(BookingPaymentStatus, { each: true })
  paymentStatus?: BookingPaymentStatus[];

  @ApiPropertyOptional({
    description: 'Filter by booking status',
    example: 'confirmed',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by event ID',
    example: 'uuid-event-id',
  })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer name or email',
    example: 'john@example.com',
  })
  @IsOptional()
  @IsString()
  customer?: string;
}
