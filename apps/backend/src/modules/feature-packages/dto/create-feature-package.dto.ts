import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber, IsOptional, IsEnum, Min, ArrayNotEmpty } from 'class-validator';

export class CreateFeaturePackageDto {
  @ApiProperty({
    description: 'Name of the feature package',
    example: 'Professional Event Management',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the feature package',
    example: 'Advanced features for professional event organizers',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'List of feature keys included in this package',
    example: ['events.read', 'events.create', 'bookings.read', 'inventory.read'],
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  features: string[];

  @ApiProperty({
    description: 'Price of the package',
    example: 79.99,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'USD',
    default: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Billing cycle',
    enum: ['monthly', 'yearly', 'one-time'],
    example: 'monthly',
    default: 'monthly',
  })
  @IsOptional()
  @IsEnum(['monthly', 'yearly', 'one-time'])
  billingCycle?: 'monthly' | 'yearly' | 'one-time';

  @ApiPropertyOptional({
    description: 'Color for UI display',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    description: 'Icon for UI display',
    example: 'Star',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
