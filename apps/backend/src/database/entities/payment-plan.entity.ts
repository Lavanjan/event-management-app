import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';
import { Booking } from './booking.entity';
import { Payment } from './payment.entity';
import { User } from './user.entity';

export enum PaymentPlanStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DEFAULTED = 'defaulted',
  SUSPENDED = 'suspended',
}

export enum PaymentPlanType {
  INSTALLMENTS = 'installments',
  SUBSCRIPTION = 'subscription',
  DEFERRED = 'deferred',
}

@Entity('payment_plans')
@Index(['organizationId'])
@Index(['bookingId'])
@Index(['status'])
@Index(['nextPaymentDate'])
@Index(['createdAt'])
@Check('"total_amount" > 0')
@Check('"installment_amount" > 0')
@Check('"installment_count" > 0')
export class PaymentPlan {
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
    enum: PaymentPlanType,
    default: PaymentPlanType.INSTALLMENTS,
    name: 'plan_type',
  })
  planType: PaymentPlanType;

  @Column({
    type: 'enum',
    enum: PaymentPlanStatus,
    default: PaymentPlanStatus.ACTIVE,
  })
  status: PaymentPlanStatus;

  @Column('decimal', { precision: 10, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'paid_amount', default: 0 })
  paidAmount: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'remaining_amount' })
  remainingAmount: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'installment_amount' })
  installmentAmount: number;

  @Column({ name: 'installment_count' })
  installmentCount: number;

  @Column({ name: 'completed_installments', default: 0 })
  completedInstallments: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ name: 'end_date' })
  endDate: Date;

  @Column({ name: 'next_payment_date' })
  nextPaymentDate: Date;

  @Column({ name: 'payment_frequency' }) // 'weekly', 'monthly', 'quarterly', etc.
  paymentFrequency: string;

  @Column('decimal', { precision: 5, scale: 2, default: 0, name: 'late_fee_percentage' })
  lateFeePercentage: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0, name: 'late_fee_amount' })
  lateFeeAmount: number;

  @Column({ name: 'grace_period_days', default: 0 })
  gracePeriodDays: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  notes: string;

  @Column('jsonb', { nullable: true })
  metadata: {
    autoPayEnabled?: boolean;
    paymentMethodId?: string;
    reminderDays?: number[];
    customTerms?: string;
    [key: string]: any;
  };

  @OneToMany(() => Payment, payment => payment.parentPayment)
  payments: Payment[];

  @Column({ nullable: true, name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  // Audit fields
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  // Virtual properties
  get isActive(): boolean {
    return this.status === PaymentPlanStatus.ACTIVE;
  }

  get isCompleted(): boolean {
    return this.status === PaymentPlanStatus.COMPLETED || this.completedInstallments >= this.installmentCount;
  }

  get isOverdue(): boolean {
    return this.isActive && this.nextPaymentDate < new Date();
  }

  get progressPercentage(): number {
    return (this.completedInstallments / this.installmentCount) * 100;
  }

  get remainingInstallments(): number {
    return this.installmentCount - this.completedInstallments;
  }

  get paymentProgress(): string {
    return `${this.completedInstallments}/${this.installmentCount}`;
  }

  get amountProgress(): string {
    return `${this.currency} ${this.paidAmount.toFixed(2)} / ${this.totalAmount.toFixed(2)}`;
  }
}
