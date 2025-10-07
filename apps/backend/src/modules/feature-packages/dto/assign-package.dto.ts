import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class AssignPackageDto {
  @ApiProperty({
    description: 'Organization ID to assign the package to',
    example: '92c8966d-a30e-4dd3-9e22-e0ba7ee20991',
  })
  @IsString()
  organizationId: string;

  @ApiProperty({
    description: 'Feature package ID to assign',
    example: '58e7a453-4a1d-4544-821e-d6601bb06e99',
  })
  @IsString()
  featurePackageId: string;

  @ApiProperty({
    description: 'ID of the user assigning the package (Product Admin)',
    example: 'admin-user-id',
  })
  @IsString()
  assignedBy: string;

  @ApiPropertyOptional({
    description: 'Expiration date for the package assignment (ISO string)',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Additional notes about the assignment',
    example: 'Upgraded to Enterprise package for Q4 2024',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
