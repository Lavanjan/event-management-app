import { IsString, IsOptional, IsNumber, IsObject, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryItemDto {
  @ApiProperty({
    description: 'Name of the inventory item',
    example: 'Round Table (8-person)',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the inventory item',
    example: 'Standard round table that seats 8 people',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Unit price of the item',
    example: 25.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @ApiProperty({
    description: 'Total quantity of the item',
    example: 20,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    description: 'SKU (Stock Keeping Unit) for the item',
    example: 'TBL-RND-8P',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({
    description: 'Category of the inventory item',
    example: 'furniture',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    description: 'Minimum quantity threshold for low stock alerts',
    example: 5,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimumQuantity?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata for the item',
    example: {
      weight: '50lbs',
      dimensions: '60" diameter',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
