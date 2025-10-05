import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Payment } from './payment.entity';
import { User } from './user.entity';

export enum TransactionType {
  PAYMENT_CREATED = 'payment_created',
  PAYMENT_PROCESSING = 'payment_processing',
  PAYMENT_COMPLETED = 'payment_completed',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_CANCELLED = 'payment_cancelled',
  REFUND_INITIATED = 'refund_initiated',
  REFUND_COMPLETED = 'refund_completed',
  REFUND_FAILED = 'refund_failed',
  CHARGEBACK_RECEIVED = 'chargeback_received',
  DISPUTE_OPENED = 'dispute_opened',
  DISPUTE_RESOLVED = 'dispute_resolved',
  STATUS_CHANGED = 'status_changed',
  AMOUNT_ADJUSTED = 'amount_adjusted',
  GATEWAY_WEBHOOK = 'gateway_webhook',
  MANUAL_UPDATE = 'manual_update',
}

@Entity('payment_transactions')
@Index(['organizationId'])
@Index(['paymentId'])
@Index(['transactionType'])
@Index(['createdAt'])
@Index(['userId'])
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'payment_id' })
  paymentId: string;

  @ManyToOne(() => Payment, { eager: false })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({
    type: 'enum',
    enum: TransactionType,
    name: 'transaction_type',
  })
  transactionType: TransactionType;

  @Column({ nullable: true, name: 'previous_status' })
  previousStatus: string;

  @Column({ nullable: true, name: 'new_status' })
  newStatus: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, name: 'amount_change' })
  amountChange: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  reason: string;

  @Column('jsonb', { nullable: true })
  metadata: {
    gatewayResponse?: any;
    webhookData?: any;
    errorCode?: string;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
    [key: string]: any;
  };

  @Column({ nullable: true, name: 'external_transaction_id' })
  externalTransactionId: string;

  @Column({ nullable: true, name: 'gateway_reference' })
  gatewayReference: string;

  @Column({ nullable: true, name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ nullable: true, name: 'user_agent' })
  userAgent: string;

  // Audit fields
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Virtual properties
  get isStatusChange(): boolean {
    return this.transactionType === TransactionType.STATUS_CHANGED;
  }

  get isPaymentAction(): boolean {
    return [
      TransactionType.PAYMENT_CREATED,
      TransactionType.PAYMENT_PROCESSING,
      TransactionType.PAYMENT_COMPLETED,
      TransactionType.PAYMENT_FAILED,
      TransactionType.PAYMENT_CANCELLED,
    ].includes(this.transactionType);
  }

  get isRefundAction(): boolean {
    return [
      TransactionType.REFUND_INITIATED,
      TransactionType.REFUND_COMPLETED,
      TransactionType.REFUND_FAILED,
    ].includes(this.transactionType);
  }

  get isDisputeAction(): boolean {
    return [
      TransactionType.CHARGEBACK_RECEIVED,
      TransactionType.DISPUTE_OPENED,
      TransactionType.DISPUTE_RESOLVED,
    ].includes(this.transactionType);
  }

  get displayType(): string {
    return this.transactionType.replace(/_/g, ' ').toUpperCase();
  }

  get hasAmountChange(): boolean {
    return this.amountChange !== null && this.amountChange !== 0;
  }
}
