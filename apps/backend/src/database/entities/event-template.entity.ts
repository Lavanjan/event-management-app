import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
  OneToMany,
} from 'typeorm';
import { Event } from './event.entity';

@Entity('event_templates')
@Index(['organizationId'])
@Index(['isActive'])
@Index(['category'])
@Check('"default_duration_hours" > 0')
@Check('"default_capacity" IS NULL OR "default_capacity" > 0')
@Check('"default_hourly_price" IS NULL OR "default_hourly_price" >= 0')
@Check('"default_half_day_price" IS NULL OR "default_half_day_price" >= 0')
@Check('"default_full_day_price" IS NULL OR "default_full_day_price" >= 0')
@Check('"required_advance_percentage" >= 0 AND "required_advance_percentage" <= 100')
@Check('"balance_payment_window_days" >= 0')
export class EventTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column('int', { name: 'default_duration_hours', default: 4 })
  defaultDurationHours: number;

  @Column('int', { name: 'default_capacity', nullable: true })
  defaultCapacity: number;

  @Column({ name: 'default_location', nullable: true })
  defaultLocation: string;

  // Pricing
  @Column('decimal', { 
    name: 'default_hourly_price', 
    precision: 10, 
    scale: 2, 
    nullable: true 
  })
  defaultHourlyPrice: number;

  @Column('decimal', { 
    name: 'default_half_day_price', 
    precision: 10, 
    scale: 2, 
    nullable: true 
  })
  defaultHalfDayPrice: number;

  @Column('decimal', { 
    name: 'default_full_day_price', 
    precision: 10, 
    scale: 2, 
    nullable: true 
  })
  defaultFullDayPrice: number;

  // Payment settings
  @Column('int', { 
    name: 'required_advance_percentage', 
    default: 50 
  })
  requiredAdvancePercentage: number;

  @Column('int', { 
    name: 'balance_payment_window_days', 
    default: 7 
  })
  balancePaymentWindowDays: number;

  // Features
  @Column({ 
    name: 'allow_inventory_allocation', 
    default: true 
  })
  allowInventoryAllocation: boolean;

  @Column({ 
    name: 'require_approval', 
    default: false 
  })
  requireApproval: boolean;

  @Column({ 
    name: 'auto_confirm', 
    default: true 
  })
  autoConfirm: boolean;

  // Required inventory (stored as JSON array)
  @Column('jsonb', { 
    name: 'required_inventory', 
    nullable: true,
    default: () => "'[]'"
  })
  requiredInventory: string[];

  // Default inventory allocations (stored as JSON)
  @Column('jsonb', { 
    name: 'default_inventory_allocations', 
    nullable: true,
    default: () => "'[]'"
  })
  defaultInventoryAllocations: Array<{
    inventoryItemId: string;
    quantity: number;
    notes?: string;
  }>;

  // Template settings (stored as JSON)
  @Column('jsonb', { 
    name: 'template_settings', 
    nullable: true,
    default: () => "'{}'"
  })
  templateSettings: {
    emailNotifications?: boolean;
    reminderSettings?: {
      enabled: boolean;
      daysBefore: number[];
    };
    customFields?: Array<{
      name: string;
      type: 'text' | 'number' | 'date' | 'select';
      required: boolean;
      options?: string[];
    }>;
  };

  // Usage tracking
  @Column('int', { name: 'usage_count', default: 0 })
  usageCount: number;

  @Column({ name: 'last_used_at', nullable: true })
  lastUsedAt: Date;

  // Organization and status
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean; // Can be used by other organizations

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Event, event => event.templateId)
  events: Event[];

  // Virtual fields for API responses
  get totalEvents(): number {
    return this.events?.length || 0;
  }

  get averageRating(): number {
    // Could be calculated from event feedback in the future
    return 0;
  }

  get estimatedRevenue(): number {
    // Could be calculated from events created from this template
    return 0;
  }
}
