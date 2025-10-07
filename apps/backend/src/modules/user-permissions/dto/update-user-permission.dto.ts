import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateUserPermissionDto } from './create-user-permission.dto';

export class UpdateUserPermissionDto extends PartialType(CreateUserPermissionDto) {
  @ApiPropertyOptional({
    description: 'ID of the user updating this permission',
    example: 'admin-user-id',
  })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}
