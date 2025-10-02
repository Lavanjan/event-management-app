import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Event } from './event.entity';
import { InventoryItem } from './inventory-item.entity';
import { Booking } from './booking.entity';
import { Role } from './role.entity';
import { OrganizationPermission } from './organization-permission.entity';

export enum OrganizationStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

@Entity('organizations')
@Index(['slug'], { unique: true })
@Index(['status'])
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column('text', { nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true, name: 'postal_code' })
  postalCode: string;

  @Column({ nullable: true })
  country: string;

  @Column({ default: 'USD', length: 3 })
  currency: string;

  @Column({
    type: 'enum',
    enum: OrganizationStatus,
    default: OrganizationStatus.ACTIVE,
  })
  status: OrganizationStatus;

  @Column('jsonb', { nullable: true })
  settings: Record<string, any>;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  // Relationships
  @OneToMany(() => OrganizationPermission, permission => permission.organization)
  permissions: OrganizationPermission[];

  // Other relationships - temporarily commented out for initial setup
  // @OneToMany('User', 'organization')
  // users: User[];

  // @OneToMany('Event', 'organization')
  // events: Event[];

  // @OneToMany('InventoryItem', 'organization')
  // inventoryItems: InventoryItem[];

  // @OneToMany('Booking', 'organization')
  // bookings: Booking[];

  // @OneToMany('Role', 'organization')
  // roles: Role[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  isActiveOrganization(): boolean {
    return this.isActive && this.status === OrganizationStatus.ACTIVE;
  }

  getDisplayName(): string {
    return this.name;
  }

  generateSlug(): string {
    return this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
