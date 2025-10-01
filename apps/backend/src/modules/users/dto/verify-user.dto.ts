import {
  IsString,
  IsOptional,
  IsUUID,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyUserDto {
  @ApiProperty({
    description: 'User ID to verify',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'OTP code for verification',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  otp: string;
}

export class ResendVerificationDto {
  @ApiProperty({
    description: 'User ID to resend verification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;
}

export class VerifyByTokenDto {
  @ApiProperty({
    description: 'Verification token from email link',
    example: 'abc123def456ghi789',
  })
  @IsString()
  token: string;

  @ApiPropertyOptional({
    description: 'OTP code for additional verification',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  otp?: string;
}
