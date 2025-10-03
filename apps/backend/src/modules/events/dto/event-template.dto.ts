import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsObject,
  Min,
  Max,
  ValidateNested,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class InventoryAllocationDto {
  @ApiProperty({ description: 'Inventory item ID' })
  @IsUUID()
  inventoryItemId: string;

  @ApiProperty({ description: 'Quantity to allocate' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Notes for this allocation' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CustomFieldDto {
  @ApiProperty({ description: 'Field name' })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Field type',
    enum: ['text', 'number', 'date', 'select']
  })
  @IsEnum(['text', 'number', 'date', 'select'])
  type: 'text' | 'number' | 'date' | 'select';

  @ApiProperty({ description: 'Whether field is required' })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({ 
    description: 'Options for select fields',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

export class ReminderSettingsDto {
  @ApiProperty({ description: 'Whether reminders are enabled' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ 
    description: 'Days before event to send reminders',
    type: [Number]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  daysBefore: number[];
}

export class TemplateSettingsDto {
  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({ 
    description: 'Reminder settings',
    type: ReminderSettingsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReminderSettingsDto)
  reminderSettings?: ReminderSettingsDto;

  @ApiPropertyOptional({ 
    description: 'Custom fields for this template',
    type: [CustomFieldDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldDto)
  customFields?: CustomFieldDto[];
}

export class CreateEventTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Template category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Default duration in hours' })
  @IsNumber()
  @Min(1)
  @Max(24)
  defaultDurationHours: number;

  @ApiPropertyOptional({ description: 'Default capacity' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  defaultCapacity?: number;

  @ApiPropertyOptional({ description: 'Default location' })
  @IsOptional()
  @IsString()
  defaultLocation?: string;

  @ApiPropertyOptional({ description: 'Default hourly price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  defaultHourlyPrice?: number;

  @ApiPropertyOptional({ description: 'Default half day price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  defaultHalfDayPrice?: number;

  @ApiPropertyOptional({ description: 'Default full day price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  defaultFullDayPrice?: number;

  @ApiProperty({ description: 'Required advance payment percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  requiredAdvancePercentage: number;

  @ApiProperty({ description: 'Balance payment window in days' })
  @IsNumber()
  @Min(0)
  balancePaymentWindowDays: number;

  @ApiPropertyOptional({ description: 'Allow inventory allocation' })
  @IsOptional()
  @IsBoolean()
  allowInventoryAllocation?: boolean;

  @ApiPropertyOptional({ description: 'Require approval for bookings' })
  @IsOptional()
  @IsBoolean()
  requireApproval?: boolean;

  @ApiPropertyOptional({ description: 'Auto confirm bookings' })
  @IsOptional()
  @IsBoolean()
  autoConfirm?: boolean;

  @ApiPropertyOptional({ 
    description: 'Required inventory items',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredInventory?: string[];

  @ApiPropertyOptional({ 
    description: 'Default inventory allocations',
    type: [InventoryAllocationDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryAllocationDto)
  defaultInventoryAllocations?: InventoryAllocationDto[];

  @ApiPropertyOptional({ 
    description: 'Template settings',
    type: TemplateSettingsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateSettingsDto)
  templateSettings?: TemplateSettingsDto;

  @ApiPropertyOptional({ description: 'Make template public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateEventTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Template category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Default duration in hours' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  defaultDurationHours?: number;

  @ApiPropertyOptional({ description: 'Default capacity' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  defaultCapacity?: number;

  @ApiPropertyOptional({ description: 'Default location' })
  @IsOptional()
  @IsString()
  defaultLocation?: string;

  @ApiPropertyOptional({ description: 'Default hourly price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  defaultHourlyPrice?: number;

  @ApiPropertyOptional({ description: 'Default half day price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  defaultHalfDayPrice?: number;

  @ApiPropertyOptional({ description: 'Default full day price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  defaultFullDayPrice?: number;

  @ApiPropertyOptional({ description: 'Required advance payment percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  requiredAdvancePercentage?: number;

  @ApiPropertyOptional({ description: 'Balance payment window in days' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balancePaymentWindowDays?: number;

  @ApiPropertyOptional({ description: 'Allow inventory allocation' })
  @IsOptional()
  @IsBoolean()
  allowInventoryAllocation?: boolean;

  @ApiPropertyOptional({ description: 'Require approval for bookings' })
  @IsOptional()
  @IsBoolean()
  requireApproval?: boolean;

  @ApiPropertyOptional({ description: 'Auto confirm bookings' })
  @IsOptional()
  @IsBoolean()
  autoConfirm?: boolean;

  @ApiPropertyOptional({ 
    description: 'Required inventory items',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredInventory?: string[];

  @ApiPropertyOptional({ 
    description: 'Default inventory allocations',
    type: [InventoryAllocationDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryAllocationDto)
  defaultInventoryAllocations?: InventoryAllocationDto[];

  @ApiPropertyOptional({ 
    description: 'Template settings',
    type: TemplateSettingsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateSettingsDto)
  templateSettings?: TemplateSettingsDto;

  @ApiPropertyOptional({ description: 'Template active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Make template public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class CreateEventFromTemplateDto {
  @ApiProperty({ description: 'Event name (overrides template name)' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Event description (overrides template)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Event location (overrides template)' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Max attendees (overrides template)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAttendees?: number;

  @ApiPropertyOptional({ description: 'Hourly price (overrides template)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  hourlyPrice?: number;

  @ApiPropertyOptional({ description: 'Half day price (overrides template)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  halfDayPrice?: number;

  @ApiPropertyOptional({ description: 'Full day price (overrides template)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  fullDayPrice?: number;
}
