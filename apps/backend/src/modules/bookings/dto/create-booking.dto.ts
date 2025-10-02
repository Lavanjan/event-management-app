import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsUUID,
  IsNumber,
  ValidateNested,
  Min,
  MaxLength,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryAllocationDto {
  @ApiProperty({
    description: 'Inventory item ID',
    example: 'uuid-here',
  })
  @IsUUID()
  inventoryItemId: string;

  @ApiProperty({
    description: 'Quantity to allocate',
    example: 5,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ExpenseDto {
  @ApiProperty({
    description: 'Expense name',
    example: 'Catering service',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Expense amount',
    example: 500.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    description: 'Expense category',
    example: 'Food & Beverage',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    description: 'Expense description',
    example: 'Premium catering package for 50 guests',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class RevenueDto {
  @ApiProperty({
    description: 'Revenue name',
    example: 'Event booking fee',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Revenue amount',
    example: 1500.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    description: 'Revenue category',
    example: 'Booking Fees',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    description: 'Revenue description',
    example: 'Base booking fee for event',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class CreateBookingDto {
  @ApiProperty({
    description: 'Event Type ID',
    example: 'uuid-here',
  })
  @IsUUID()
  eventId: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'John Doe',
  })
  @IsString()
  @MaxLength(255)
  customerName: string;

  @ApiProperty({
    description: 'Customer email',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  customerEmail: string;

  @ApiPropertyOptional({
    description: 'Customer phone number',
    example: '+1-555-123-4567',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerPhone?: string;

  @ApiProperty({
    description: 'Booking start date and time',
    example: '2024-12-15T18:00:00Z',
  })
  @IsString()
  startDate: string;

  @ApiProperty({
    description: 'Booking end date and time',
    example: '2024-12-15T23:00:00Z',
  })
  @IsString()
  endDate: string;

  @ApiProperty({
    description: 'Duration type for pricing',
    example: 'full_day',
    enum: ['hourly', 'half_day', 'full_day'],
  })
  @IsEnum(['hourly', 'half_day', 'full_day'])
  durationType: 'hourly' | 'half_day' | 'full_day';

  @ApiPropertyOptional({
    description: 'Duration in hours (required for hourly bookings)',
    example: 5,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  durationHours?: number;

  @ApiPropertyOptional({
    description: 'Half day slot (required for half_day bookings)',
    example: 'morning',
    enum: ['morning', 'evening'],
  })
  @IsOptional()
  @IsEnum(['morning', 'evening'])
  halfDaySlot?: 'morning' | 'evening';

  @ApiPropertyOptional({
    description: 'Inventory items to allocate',
    type: [InventoryAllocationDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryAllocationDto)
  inventoryAllocations?: InventoryAllocationDto[];

  @ApiPropertyOptional({
    description: 'Initial expenses for the booking',
    type: [ExpenseDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseDto)
  expenses?: ExpenseDto[];

  @ApiPropertyOptional({
    description: 'Initial revenues for the booking',
    type: [RevenueDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RevenueDto)
  revenues?: RevenueDto[];

  @ApiPropertyOptional({
    description: 'Additional notes for the booking',
    example: 'Special dietary requirements: vegetarian options needed',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
