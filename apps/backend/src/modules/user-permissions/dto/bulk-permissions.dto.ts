import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, ArrayNotEmpty } from 'class-validator';

export class BulkGrantPermissionsDto {
  @ApiProperty({
    description: 'User ID to grant permissions to',
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
    description: 'Array of permission keys to grant',
    example: ['events.create', 'events.update', 'bookings.read'],
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionKeys: string[];

  @ApiProperty({
    description: 'ID of the user granting these permissions',
    example: 'admin-user-id',
  })
  @IsString()
  grantedBy: string;

  @ApiPropertyOptional({
    description: 'Reason for granting these permissions',
    example: 'Bulk permission grant for new role assignment',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkRevokePermissionsDto {
  @ApiProperty({
    description: 'User ID to revoke permissions from',
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
    description: 'Array of permission keys to revoke',
    example: ['events.delete', 'users.delete'],
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionKeys: string[];

  @ApiProperty({
    description: 'ID of the user revoking these permissions',
    example: 'admin-user-id',
  })
  @IsString()
  revokedBy: string;

  @ApiPropertyOptional({
    description: 'Reason for revoking these permissions',
    example: 'Security policy update - removing dangerous permissions',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
