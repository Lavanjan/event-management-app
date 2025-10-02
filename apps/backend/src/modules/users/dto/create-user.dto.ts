import {
  IsEmail,
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'User password (auto-generated if not provided)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Array of role IDs to assign to the user',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  roleIds?: string[];

  @ApiPropertyOptional({
    description: 'Whether the user is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to send email with credentials',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @ApiPropertyOptional({
    description: 'Auto-generate secure password instead of manual entry',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoGenerateCredentials?: boolean;

  @ApiPropertyOptional({
    description: 'Require email verification before account activation',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresVerification?: boolean;
}
