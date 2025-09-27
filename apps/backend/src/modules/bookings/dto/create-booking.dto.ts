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
    example: 500.00,
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
    example: 1500.00,
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
    description: 'Event ID',
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
