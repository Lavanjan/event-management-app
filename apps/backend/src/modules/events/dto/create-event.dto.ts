import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({
    description: 'Name of the event type (e.g., Wedding Ceremony, Birthday Party)',
    example: 'Wedding Ceremony',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the event type',
    example: 'Elegant wedding ceremony package with full decorations',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Event location/venue (e.g., Wedding Hall, Conference Room)',
    example: 'Wedding Hall',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of attendees',
    example: 200,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxAttendees?: number;

  @ApiPropertyOptional({
    description: 'Price per hour',
    example: 500.0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hourlyPrice?: number;

  @ApiPropertyOptional({
    description: 'Price for half day (typically 4-6 hours)',
    example: 2000.0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  halfDayPrice?: number;

  @ApiPropertyOptional({
    description: 'Price for full day (typically 8-12 hours)',
    example: 3500.0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fullDayPrice?: number;

  @ApiProperty({
    description: 'Required advance payment percentage',
    example: 50,
    minimum: 0,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  requiredAdvancePercentage: number;

  @ApiProperty({
    description: 'Balance payment window in days before event',
    example: 7,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  balancePaymentWindowDays: number;

  @ApiProperty({
    description: 'Whether to allow inventory allocation for this event type',
    example: true,
  })
  @IsBoolean()
  allowInventoryAllocation: boolean;
}
