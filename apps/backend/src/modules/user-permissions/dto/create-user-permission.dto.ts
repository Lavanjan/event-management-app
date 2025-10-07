import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export class CreateUserPermissionDto {
  @ApiProperty({
    description: 'User ID to grant/deny permission to',
    example: 'user-uuid',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '92c8966d-a30e-4dd3-9e22-e0ba7ee20991',
  })
  @IsString()
  organizationId: string;

  @ApiProperty({
    description: 'Permission key to grant/deny',
    example: 'events.create',
  })
  @IsString()
  permissionKey: string;

  @ApiPropertyOptional({
    description: 'Whether the permission is enabled',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Type of permission override',
    enum: ['grant', 'deny'],
    example: 'grant',
    default: 'grant',
  })
  @IsOptional()
  @IsEnum(['grant', 'deny'])
  type?: 'grant' | 'deny';

  @ApiProperty({
    description: 'ID of the user granting this permission',
    example: 'admin-user-id',
  })
  @IsString()
  grantedBy: string;

  @ApiPropertyOptional({
    description: 'Reason for granting/denying this permission',
    example: 'User needs access to create events for special project',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Temporary access until project completion',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
