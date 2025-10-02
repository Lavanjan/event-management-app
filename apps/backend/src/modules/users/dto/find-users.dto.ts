import { IsOptional, IsString, IsEnum, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { UserType } from '../../../database/entities/user.entity';

export class FindUsersDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by user role/type',
    enum: UserType,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf(o => o.role !== undefined && o.role !== null)
  @IsEnum(UserType)
  role?: UserType;

  @ApiPropertyOptional({
    description: 'Filter by user status',
    enum: ['active', 'inactive'],
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  status?: string;
}
