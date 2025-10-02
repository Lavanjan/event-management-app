import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Search term for filtering results',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC', 'asc', 'desc'],
    default: 'ASC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  @Transform(({ value }) => value?.toUpperCase())
  sortOrder?: 'ASC' | 'DESC' = 'ASC';

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export class PaginatedResponseDto<T> {
  @ApiPropertyOptional({ description: 'Array of items' })
  data: T[];

  @ApiPropertyOptional({ description: 'Total number of items' })
  total: number;

  @ApiPropertyOptional({ description: 'Current page number' })
  page: number;

  @ApiPropertyOptional({ description: 'Number of items per page' })
  limit: number;

  @ApiPropertyOptional({ description: 'Total number of pages' })
  totalPages: number;

  @ApiPropertyOptional({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiPropertyOptional({ description: 'Whether there is a previous page' })
  hasPrev: boolean;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}
