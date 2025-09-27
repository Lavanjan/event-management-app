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
    description: 'Name of the event',
    example: 'Annual Corporate Gala',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the event',
    example: 'Elegant corporate gala dinner for 200 guests',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Event start date and time',
    example: '2024-12-15T18:00:00Z',
  })
  @IsDateString()
  startDate: Date;

  @ApiProperty({
    description: 'Event end date and time',
    example: '2024-12-15T23:00:00Z',
  })
  @IsDateString()
  endDate: Date;

  @ApiPropertyOptional({
    description: 'Event location',
    example: 'Grand Ballroom, Downtown Hotel',
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
    description: 'Whether to allow inventory allocation for this event',
    example: true,
  })
  @IsBoolean()
  allowInventoryAllocation: boolean;
}
