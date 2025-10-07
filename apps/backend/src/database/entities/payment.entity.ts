import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';
import { Booking } from './booking.entity';
import { User } from './user.entity';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CHECK = 'check',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  SQUARE = 'square',
  OTHER = 'other',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  PARTIAL_REFUND = 'partial_refund',
  CHARGEBACK = 'chargeback',
}

@Entity('payments')
@Index(['organizationId'])
@Index(['bookingId'])
@Index(['status'])
@Index(['paymentMethod'])
@Index(['paymentType'])
@Index(['createdAt'])
@Index(['transactionId'])
@Check('"amount" > 0')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking, { eager: false })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.PAYMENT,
    name: 'payment_type',
  })
  paymentType: PaymentType;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0, name: 'fee_amount' })
  feeAmount: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'net_amount' })
  netAmount: number;

  @Column({ length: 3, default: 'LKR' })
  currency: string;

  @Column({ nullable: true, name: 'transaction_id' })
  transactionId: string;

  @Column({ nullable: true, name: 'external_payment_id' })
  externalPaymentId: string;

  @Column({ nullable: true, name: 'gateway_response' })
  gatewayResponse: string;

  @Column({ nullable: true, name: 'reference_number' })
  referenceNumber: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  notes: string;

  // Payment gateway specific data
  @Column('jsonb', { nullable: true, name: 'gateway_data' })
  gatewayData: {
    gatewayName?: string;
    gatewayTransactionId?: string;
    gatewayFee?: number;
    gatewayStatus?: string;
    gatewayResponse?: any;
    [key: string]: any;
  };

  // Customer payment information (encrypted/tokenized)
  @Column('jsonb', { nullable: true, name: 'payment_details' })
  paymentDetails: {
    cardLast4?: string;
    cardBrand?: string;
    cardExpiry?: string;
    bankName?: string;
    accountLast4?: string;
    paypalEmail?: string;
    [key: string]: any;
  };

  @Column({ nullable: true, name: 'processed_by' })
  processedBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'processed_by' })
  processor: User;

  @Column({ nullable: true, name: 'processed_at' })
  processedAt: Date;

  @Column({ nullable: true, name: 'due_date' })
  dueDate: Date;

  @Column({ nullable: true, name: 'parent_payment_id' })
  parentPaymentId: string;

  @ManyToOne(() => Payment, { eager: false })
  @JoinColumn({ name: 'parent_payment_id' })
  parentPayment: Payment;

  // Audit fields
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  // Virtual properties
  get isRefund(): boolean {
    return this.paymentType === PaymentType.REFUND || this.paymentType === PaymentType.PARTIAL_REFUND;
  }

  get isCompleted(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  get isPending(): boolean {
    return this.status === PaymentStatus.PENDING || this.status === PaymentStatus.PROCESSING;
  }

  get isFailed(): boolean {
    return this.status === PaymentStatus.FAILED || this.status === PaymentStatus.CANCELLED;
  }

  get displayAmount(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  get displayStatus(): string {
    return this.status.replace('_', ' ').toUpperCase();
  }
}
