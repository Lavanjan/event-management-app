import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsObject, IsEnum } from 'class-validator';

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export enum Language {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
  PT = 'pt',
  JA = 'ja',
  ZH = 'zh',
  HI = 'hi',
  AR = 'ar',
}

export enum DateFormat {
  MM_DD_YYYY = 'MM/dd/yyyy',
  DD_MM_YYYY = 'dd/MM/yyyy',
  YYYY_MM_DD = 'yyyy-MM-dd',
  MMM_DD_YYYY = 'MMM dd, yyyy',
  DD_MMM_YYYY = 'dd MMM yyyy',
}

export enum TimeFormat {
  TWELVE_HOUR = '12h',
  TWENTY_FOUR_HOUR = '24h',
}

export class UpdateUserPreferencesDto {
  @ApiPropertyOptional({
    description: 'User preferred theme mode',
    enum: ThemeMode,
    example: ThemeMode.LIGHT,
  })
  @IsOptional()
  @IsEnum(ThemeMode)
  themeMode?: ThemeMode;

  @ApiPropertyOptional({
    description: 'User preferred language',
    enum: Language,
    example: Language.EN,
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiPropertyOptional({
    description: 'User preferred date format',
    enum: DateFormat,
    example: DateFormat.MM_DD_YYYY,
  })
  @IsOptional()
  @IsEnum(DateFormat)
  dateFormat?: DateFormat;

  @ApiPropertyOptional({
    description: 'User preferred time format',
    enum: TimeFormat,
    example: TimeFormat.TWELVE_HOUR,
  })
  @IsOptional()
  @IsEnum(TimeFormat)
  timeFormat?: TimeFormat;

  @ApiPropertyOptional({
    description: 'User timezone preference',
    example: 'America/New_York',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Enable desktop notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableDesktopNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable email notifications for user',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableEmailNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable SMS notifications for user',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  enableSmsNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable sound notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableSoundNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Dashboard layout preferences',
    example: {
      compactMode: false,
      showQuickActions: true,
      defaultView: 'grid',
      itemsPerPage: 25,
    },
  })
  @IsOptional()
  @IsObject()
  dashboardLayout?: {
    compactMode?: boolean;
    showQuickActions?: boolean;
    defaultView?: string;
    itemsPerPage?: number;
  };

  @ApiPropertyOptional({
    description: 'Table display preferences',
    example: {
      density: 'comfortable',
      showRowNumbers: false,
      defaultPageSize: 25,
      stickyHeader: true,
    },
  })
  @IsOptional()
  @IsObject()
  tablePreferences?: {
    density?: string;
    showRowNumbers?: boolean;
    defaultPageSize?: number;
    stickyHeader?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Calendar view preferences',
    example: {
      defaultView: 'month',
      startOfWeek: 'sunday',
      showWeekends: true,
      workingHours: { start: '09:00', end: '17:00' },
    },
  })
  @IsOptional()
  @IsObject()
  calendarPreferences?: {
    defaultView?: string;
    startOfWeek?: string;
    showWeekends?: boolean;
    workingHours?: {
      start?: string;
      end?: string;
    };
  };

  @ApiPropertyOptional({
    description: 'Accessibility preferences',
    example: {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
    },
  })
  @IsOptional()
  @IsObject()
  accessibilityPreferences?: {
    highContrast?: boolean;
    largeText?: boolean;
    reducedMotion?: boolean;
    screenReader?: boolean;
  };
}
