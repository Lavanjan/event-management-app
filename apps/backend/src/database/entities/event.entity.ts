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
// import { Organization } from './organization.entity';

@Entity('events')
@Index(['organizationId'])
@Index(['startDate'])
@Index(['isActive'])
@Check('"start_date" < "end_date"')
@Check('"required_advance_percentage" >= 0 AND "required_advance_percentage" <= 100')
@Check('"balance_payment_window_days" >= 0')
@Check('"max_attendees" IS NULL OR "max_attendees" > 0')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('timestamp', { name: 'start_date' })
  startDate: Date;

  @Column('timestamp', { name: 'end_date' })
  endDate: Date;

  @Column({ nullable: true })
  location: string;

  @Column('int', { nullable: true, name: 'max_attendees' })
  maxAttendees: number;

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

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => Booking, booking => booking.event)
  bookings: Booking[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  get currentAttendees(): number {
    return (
      this.bookings?.filter(
        booking => booking.status === 'confirmed' || booking.status === 'completed'
      ).length || 0
    );
  }

  get availableSpots(): number {
    if (!this.maxAttendees) return Infinity;
    return Math.max(0, this.maxAttendees - this.currentAttendees);
  }

  canAcceptBooking(): boolean {
    return (
      this.isActive &&
      new Date() < this.startDate &&
      (this.maxAttendees === null || this.currentAttendees < this.maxAttendees)
    );
  }

  calculateAdvanceDueDate(): Date {
    // Advance payment due immediately upon booking
    return new Date();
  }

  calculateBalanceDueDate(): Date {
    const dueDate = new Date(this.startDate);
    dueDate.setDate(dueDate.getDate() - this.balancePaymentWindowDays);
    return dueDate;
  }

  isInPast(): boolean {
    return new Date() > this.endDate;
  }
}
