import {
  IsString,
  IsEmail,
  IsOptional,
  IsUrl,
  IsEnum,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationStatus } from '../../../database/entities';

export class CreateOrganizationAdminDto {
  @ApiProperty({ description: 'Organization admin email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Organization admin first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Organization admin last name' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Organization admin password (if not provided, will be auto-generated)',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'Whether to auto-generate password', default: true })
  @IsOptional()
  @IsBoolean()
  autoGeneratePassword?: boolean;

  @ApiPropertyOptional({
    description: 'Require email verification before activation (default: true)',
  })
  @IsOptional()
  @IsBoolean()
  requiresVerification?: boolean;
}

export class CreateOrganizationDto {
  @ApiProperty({ description: 'Organization name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Organization slug (if not provided, will be auto-generated)',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Organization description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Organization website URL' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Organization phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Organization email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Organization address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Organization city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Organization state/province' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Organization postal code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Organization country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Organization currency code (ISO 4217)',
    default: 'USD',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Organization status',
    enum: OrganizationStatus,
    default: OrganizationStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(OrganizationStatus)
  status?: OrganizationStatus;

  @ApiPropertyOptional({ description: 'Organization settings (JSON object)' })
  @IsOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Organization metadata (JSON object)' })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Organization admin details' })
  @ValidateNested()
  @Type(() => CreateOrganizationAdminDto)
  admin: CreateOrganizationAdminDto;
}
