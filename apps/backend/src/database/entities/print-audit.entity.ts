import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Booking } from './booking.entity';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export enum PrintStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export enum PrintType {
  BILL = 'BILL',
  RECEIPT = 'RECEIPT',
  INVOICE = 'INVOICE',
  REPRINT = 'REPRINT',
}

@Entity('print_audits')
@Index(['organizationId', 'createdAt'])
@Index(['bookingId', 'printType'])
@Index(['userId', 'createdAt'])
export class PrintAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    name: 'print_type',
    type: 'enum',
    enum: PrintType,
    default: PrintType.BILL,
  })
  printType: PrintType;

  @Column({
    name: 'print_status',
    type: 'enum',
    enum: PrintStatus,
    default: PrintStatus.PENDING,
  })
  printStatus: PrintStatus;

  @Column({ name: 'printer_name', nullable: true })
  printerName?: string;

  @Column({ name: 'printer_interface', nullable: true })
  printerInterface?: string;

  @Column({ name: 'print_data', type: 'jsonb', nullable: true })
  printData?: {
    bookingDetails?: any;
    customerInfo?: any;
    financialInfo?: any;
    organizationInfo?: any;
    printSettings?: any;
  };

  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string;

  @Column({ name: 'error_code', nullable: true })
  errorCode?: string;

  @Column({ name: 'error_details', type: 'jsonb', nullable: true })
  errorDetails?: any;

  @Column({ name: 'print_duration_ms', nullable: true })
  printDurationMs?: number;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', default: 3 })
  maxRetries: number;

  @Column({ name: 'is_reprint', default: false })
  isReprint: boolean;

  @Column({ name: 'original_print_id', type: 'uuid', nullable: true })
  originalPrintId?: string;

  @Column({ name: 'receipt_number', nullable: true })
  receiptNumber?: string;

  @Column({ name: 'print_started_at', type: 'timestamp with time zone', nullable: true })
  printStartedAt?: Date;

  @Column({ name: 'print_completed_at', type: 'timestamp with time zone', nullable: true })
  printCompletedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Booking, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // Virtual properties
  get isSuccessful(): boolean {
    return this.printStatus === PrintStatus.SUCCESS;
  }

  get isFailed(): boolean {
    return this.printStatus === PrintStatus.FAILED;
  }

  get isPending(): boolean {
    return this.printStatus === PrintStatus.PENDING;
  }

  get canRetry(): boolean {
    return this.printStatus === PrintStatus.FAILED && this.retryCount < 3;
  }

  get formattedDuration(): string {
    if (!this.printDurationMs) return 'N/A';
    
    if (this.printDurationMs < 1000) {
      return `${this.printDurationMs}ms`;
    }
    
    return `${(this.printDurationMs / 1000).toFixed(2)}s`;
  }

  get printTypeDisplay(): string {
    switch (this.printType) {
      case PrintType.BILL:
        return 'Bill';
      case PrintType.RECEIPT:
        return 'Receipt';
      case PrintType.INVOICE:
        return 'Invoice';
      case PrintType.REPRINT:
        return 'Reprint';
      default:
        return 'Unknown';
    }
  }

  get statusDisplay(): string {
    switch (this.printStatus) {
      case PrintStatus.SUCCESS:
        return 'Success';
      case PrintStatus.FAILED:
        return 'Failed';
      case PrintStatus.PENDING:
        return 'Pending';
      default:
        return 'Unknown';
    }
  }
}
