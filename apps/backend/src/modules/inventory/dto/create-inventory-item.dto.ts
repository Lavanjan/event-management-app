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
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: 'Unit of measurement for quantity',
    example: 'pieces',
    default: 'pieces',
  })
  @IsString()
  @MaxLength(50)
  quantityUnit: string;

  @ApiPropertyOptional({
    description: 'SKU (Stock Keeping Unit) for the item',
    example: 'TBL-RND-8P',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({
    description: 'Category ID of the inventory item',
    example: 'uuid-string',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Brand of the inventory item',
    example: 'IKEA',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({
    description: 'Low stock threshold for alerts',
    example: 5,
    minimum: 0,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  lowStockThreshold?: number;

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
