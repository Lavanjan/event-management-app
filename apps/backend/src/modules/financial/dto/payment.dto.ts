import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  Min,
  Max,
  IsEmail,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../../../database/entities';

export enum PaymentType {
  ADVANCE = 'advance',
  BALANCE = 'balance',
  REFUND = 'refund',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  ONLINE = 'online',
  OTHER = 'other',
}

export enum ReminderTemplate {
  GENTLE = 'gentle',
  URGENT = 'urgent',
  FINAL = 'final',
}

export class CreatePaymentRecordDto {
  @ApiProperty({
    description: 'Booking ID for the payment',
    example: 'uuid-here',
  })
  @IsUUID()
  bookingId: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 500.00,
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Type of payment',
    enum: PaymentType,
    example: PaymentType.ADVANCE,
  })
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiPropertyOptional({
    description: 'Payment method used',
    enum: PaymentMethod,
    example: PaymentMethod.CARD,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Transaction ID from payment processor',
    example: 'txn_1234567890',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Payment reference number',
    example: 'REF-2024-001',
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the payment',
    example: 'Payment received via bank transfer',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PaymentReminderDto {
  @ApiProperty({
    description: 'Booking ID for the reminder',
    example: 'uuid-here',
  })
  @IsUUID()
  bookingId: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'customer@example.com',
  })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'John Doe',
  })
  @IsString()
  customerName: string;

  @ApiProperty({
    description: 'Event name',
    example: 'Wedding Reception',
  })
  @IsString()
  eventName: string;

  @ApiProperty({
    description: 'Amount due',
    example: 1000.00,
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Due date for the payment',
    example: '2024-12-31',
  })
  @IsString()
  dueDate: string;

  @ApiProperty({
    description: 'Type of payment due',
    enum: PaymentType,
    example: PaymentType.ADVANCE,
  })
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiPropertyOptional({
    description: 'Reminder template to use',
    enum: ReminderTemplate,
    example: ReminderTemplate.GENTLE,
  })
  @IsOptional()
  @IsEnum(ReminderTemplate)
  template?: ReminderTemplate;
}

export class BulkPaymentReminderDto {
  @ApiProperty({
    description: 'Array of booking IDs to send reminders for',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  bookingIds: string[];

  @ApiPropertyOptional({
    description: 'Reminder template to use for all reminders',
    enum: ReminderTemplate,
    example: ReminderTemplate.GENTLE,
  })
  @IsOptional()
  @IsEnum(ReminderTemplate)
  template?: ReminderTemplate;
}

export class ProcessRefundDto {
  @ApiProperty({
    description: 'Booking ID for the refund',
    example: 'uuid-here',
  })
  @IsUUID()
  bookingId: string;

  @ApiProperty({
    description: 'Refund amount',
    example: 250.00,
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'Reason for the refund',
    example: 'Event cancelled by customer',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ValidatePaymentDto {
  @ApiProperty({
    description: 'Transaction ID to validate',
    example: 'txn_1234567890',
  })
  @IsString()
  transactionId: string;

  @ApiProperty({
    description: 'Expected payment amount',
    example: 500.00,
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
}

export class BulkUpdatePaymentStatusDto {
  @ApiProperty({
    description: 'Array of booking IDs to update',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  bookingIds: string[];

  @ApiProperty({
    description: 'New payment status',
    enum: PaymentStatus,
    example: PaymentStatus.FULLY_PAID,
  })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;
}

export class PaymentMethodDto {
  @ApiProperty({
    description: 'Payment method ID',
    example: 'uuid-here',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Payment method name',
    example: 'Credit Card',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Payment method type',
    enum: PaymentMethod,
    example: PaymentMethod.CARD,
  })
  @IsEnum(PaymentMethod)
  type: PaymentMethod;

  @ApiProperty({
    description: 'Whether this payment method is active',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Processing fee percentage',
    example: 2.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  processingFee?: number;
}
