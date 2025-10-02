import { IsOptional, IsEnum, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { OrganizationStatus } from '../../../database/entities/organization.entity';

export class FindOrganizationsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by organization status',
    enum: OrganizationStatus,
    example: OrganizationStatus.ACTIVE,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? undefined : value
  )
  @IsEnum(OrganizationStatus, { message: 'Status must be a valid organization status' })
  status?: OrganizationStatus;

  @ApiPropertyOptional({
    description: 'Search organizations by name or description',
    example: 'Tech Company',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  search?: string;
}
