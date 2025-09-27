import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddRevenueDto {
  @ApiProperty({
    description: 'Revenue name',
    example: 'Additional services fee',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Revenue amount',
    example: 300.00,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    description: 'Revenue category',
    example: 'Additional Services',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    description: 'Revenue description',
    example: 'Premium lighting package upgrade',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
