import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  AfterLoad,
  Check,
  Index,
} from 'typeorm';
import { Event } from './event.entity';
import { BookingInventoryAllocation } from './booking-inventory-allocation.entity';
import { BookingExpense } from './booking-expense.entity';
import { BookingRevenue } from './booking-revenue.entity';
// import { Organization } from './organization.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  STARTED = 'started',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  ADVANCE_PAID = 'advance_paid',
  FULLY_PAID = 'fully_paid',
  OVERDUE = 'overdue',
  REFUNDED = 'refunded',
}

@Entity('bookings')
@Index(['organizationId'])
@Index(['eventId'])
@Index(['status'])
@Index(['paymentStatus'])
@Index(['startDate'])
@Index(['endDate'])
@Check('"total_amount" >= 0')
@Check('"advance_amount" >= 0')
@Check('"balance_amount" >= 0')
@Check('"advance_amount" + "balance_amount" = "total_amount"')
@Check('"start_date" < "end_date"')
@Check("\"duration_type\" IN ('hourly', 'half_day', 'full_day')")
@Check("\"status\" IN ('pending', 'confirmed', 'started', 'cancelled', 'completed')")
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, event => event.bookings, { eager: true })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ name: 'customer_name' })
  customerName: string;

  @Column({ name: 'customer_email' })
  customerEmail: string;

  @Column({ nullable: true, name: 'customer_phone' })
  customerPhone: string;

  @Column('timestamp', { name: 'start_date' })
  startDate: Date;

  @Column('timestamp', { name: 'end_date' })
  endDate: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, name: 'duration_hours' })
  durationHours?: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'hourly',
    name: 'duration_type',
  })
  durationType: 'hourly' | 'half_day' | 'full_day';

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'half_day_slot',
  })
  halfDaySlot?: 'morning' | 'evening';

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    name: 'payment_status',
  })
  paymentStatus: PaymentStatus;

  @Column('decimal', { precision: 10, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'advance_amount' })
  advanceAmount: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'balance_amount' })
  balanceAmount: number;

  @Column('timestamp', { name: 'advance_due_date' })
  advanceDueDate: Date;

  @Column('timestamp', { name: 'balance_due_date' })
  balanceDueDate: Date;

  @Column('decimal', { precision: 10, scale: 2, name: 'total_expenses', default: 0 })
  totalExpenses: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'total_revenues', default: 0 })
  totalRevenues: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'profit_loss', default: 0 })
  profitLoss: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string;

  // @ManyToOne('Organization', 'bookings', {
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'organization_id' })
  // organization: Organization;

  @OneToMany(() => BookingInventoryAllocation, allocation => allocation.booking, {
    cascade: true,
    eager: true,
  })
  inventoryAllocations: BookingInventoryAllocation[];

  @OneToMany(() => BookingExpense, expense => expense.booking, {
    cascade: true,
    eager: true,
  })
  expenses: BookingExpense[];

  @OneToMany(() => BookingRevenue, revenue => revenue.booking, {
    cascade: true,
    eager: true,
  })
  revenues: BookingRevenue[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @AfterLoad()
  calculateTotals() {
    this.totalExpenses =
      this.expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
    this.totalRevenues =
      this.revenues?.reduce((sum, revenue) => sum + Number(revenue.amount), 0) || 0;
    this.profitLoss = this.totalRevenues - this.totalExpenses;
  }

  get inventoryTotal(): number {
    return (
      this.inventoryAllocations?.reduce(
        (sum, allocation) => sum + Number(allocation.totalPrice),
        0
      ) || 0
    );
  }

  isAdvanceOverdue(): boolean {
    return this.paymentStatus === PaymentStatus.PENDING && new Date() > this.advanceDueDate;
  }

  isBalanceOverdue(): boolean {
    return this.paymentStatus === PaymentStatus.ADVANCE_PAID && new Date() > this.balanceDueDate;
  }

  canBeCancelled(): boolean {
    return this.status !== BookingStatus.CANCELLED && this.status !== BookingStatus.COMPLETED;
  }

  canBeCompleted(): boolean {
    return (
      this.status === BookingStatus.CONFIRMED && this.paymentStatus === PaymentStatus.FULLY_PAID
    );
  }
}
