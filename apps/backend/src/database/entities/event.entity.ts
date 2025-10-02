import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Check,
  Index,
} from 'typeorm';
import { Booking } from './booking.entity';
import { EventTemplate } from './event-template.entity';
// import { Organization } from './organization.entity';

@Entity('events')
@Index(['organizationId'])
@Index(['isActive'])
@Check('"required_advance_percentage" >= 0 AND "required_advance_percentage" <= 100')
@Check('"balance_payment_window_days" >= 0')
@Check('"max_attendees" IS NULL OR "max_attendees" > 0')
@Check('"hourly_price" IS NULL OR "hourly_price" >= 0')
@Check('"half_day_price" IS NULL OR "half_day_price" >= 0')
@Check('"full_day_price" IS NULL OR "full_day_price" >= 0')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  location: string;

  @Column('int', { nullable: true, name: 'max_attendees' })
  maxAttendees: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'hourly_price',
  })
  hourlyPrice?: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'half_day_price',
  })
  halfDayPrice?: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'full_day_price',
  })
  fullDayPrice?: number;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    name: 'required_advance_percentage',
    default: 50,
  })
  requiredAdvancePercentage: number;

  @Column('int', {
    name: 'balance_payment_window_days',
    default: 7,
  })
  balancePaymentWindowDays: number;

  @Column({
    default: true,
    name: 'allow_inventory_allocation',
  })
  allowInventoryAllocation: boolean;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string;

  // @ManyToOne('Organization', 'events', {
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'organization_id' })
  // organization: Organization;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId?: string;

  @ManyToOne(() => EventTemplate, template => template.events, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'template_id' })
  template?: EventTemplate;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => Booking, booking => booking.event)
  bookings: Booking[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Deprecated fields - kept for backward compatibility during migration
  @Column('timestamp', { name: 'start_date', nullable: true })
  startDate?: Date;

  @Column('timestamp', { name: 'end_date', nullable: true })
  endDate?: Date;

  /**
   * Calculate price based on duration type
   */
  calculatePrice(durationType: 'hourly' | 'half_day' | 'full_day', hours?: number): number {
    switch (durationType) {
      case 'hourly':
        return this.hourlyPrice && hours ? this.hourlyPrice * hours : 0;
      case 'half_day':
        return this.halfDayPrice || 0;
      case 'full_day':
        return this.fullDayPrice || 0;
      default:
        return 0;
    }
  }

  /**
   * Calculate advance amount based on total and percentage
   */
  calculateAdvanceAmount(totalAmount: number): number {
    return (totalAmount * this.requiredAdvancePercentage) / 100;
  }

  /**
   * Calculate balance amount
   */
  calculateBalanceAmount(totalAmount: number, advanceAmount: number): number {
    return totalAmount - advanceAmount;
  }

  /**
   * Calculate balance due date based on booking start date
   */
  calculateBalanceDueDate(bookingStartDate: Date): Date {
    const dueDate = new Date(bookingStartDate);
    dueDate.setDate(dueDate.getDate() - this.balancePaymentWindowDays);
    return dueDate;
  }
}
