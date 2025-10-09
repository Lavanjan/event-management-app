import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber, IsObject, IsEnum } from 'class-validator';

export enum CurrencyCode {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD',
  JPY = 'JPY',
  INR = 'INR',
  CNY = 'CNY',
  BRL = 'BRL',
  MXN = 'MXN',
  LKR = 'LKR',
}

export enum TimeZone {
  UTC = 'UTC',
  EST = 'America/New_York',
  PST = 'America/Los_Angeles',
  GMT = 'Europe/London',
  CET = 'Europe/Paris',
  JST = 'Asia/Tokyo',
  IST = 'Asia/Kolkata',
  CST = 'Asia/Shanghai',
  AEST = 'Australia/Sydney',
  PST_ASIA = 'Asia/Colombo',
}

export class UpdateOrganizationSettingsDto {
  @ApiPropertyOptional({
    description: 'Organization display name',
    example: 'Acme Events Ltd.',
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Organization description',
    example: 'Premier event management company',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Organization website URL',
    example: 'https://acmeevents.com',
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({
    description: 'Organization phone number',
    example: '+1-555-123-4567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Organization address',
    example: '123 Main St, City, State 12345',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Default currency for the organization',
    enum: CurrencyCode,
    example: CurrencyCode.USD,
  })
  @IsOptional()
  @IsEnum(CurrencyCode)
  currency?: CurrencyCode;

  @ApiPropertyOptional({
    description: 'Organization timezone',
    enum: TimeZone,
    example: TimeZone.EST,
  })
  @IsOptional()
  @IsEnum(TimeZone)
  timezone?: TimeZone;

  @ApiPropertyOptional({
    description: 'Default advance payment percentage required for bookings',
    example: 25,
  })
  @IsOptional()
  @IsNumber()
  defaultAdvancePercentage?: number;

  @ApiPropertyOptional({
    description: 'Default balance payment window in days',
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  defaultBalancePaymentWindowDays?: number;

  @ApiPropertyOptional({
    description: 'Enable email notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableEmailNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable SMS notifications',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  enableSmsNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable automatic booking confirmations',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableAutoBookingConfirmation?: boolean;

  @ApiPropertyOptional({
    description: 'Enable inventory tracking',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableInventoryTracking?: boolean;

  @ApiPropertyOptional({
    description: 'Enable financial reporting',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableFinancialReporting?: boolean;

  @ApiPropertyOptional({
    description: 'Custom branding settings',
    example: {
      primaryColor: '#14A76C',
      secondaryColor: '#ffffff',
      logoUrl: 'https://example.com/logo.png',
      faviconUrl: 'https://example.com/favicon.ico',
    },
  })
  @IsOptional()
  @IsObject()
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
  };

  @ApiPropertyOptional({
    description: 'Email template settings',
    example: {
      fromName: 'Acme Events',
      fromEmail: 'noreply@acmeevents.com',
      replyToEmail: 'support@acmeevents.com',
    },
  })
  @IsOptional()
  @IsObject()
  emailSettings?: {
    fromName?: string;
    fromEmail?: string;
    replyToEmail?: string;
  };

  @ApiPropertyOptional({
    description: 'Business hours configuration',
    example: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true },
    },
  })
  @IsOptional()
  @IsObject()
  businessHours?: {
    [key: string]: {
      open?: string;
      close?: string;
      closed?: boolean;
    };
  };
}
