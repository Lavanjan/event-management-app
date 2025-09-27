import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddExpenseDto {
  @ApiProperty({
    description: 'Expense name',
    example: 'Additional catering',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Expense amount',
    example: 250.00,
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
    example: 'Extra appetizers for late arrivals',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
