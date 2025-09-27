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
import { BookingInventoryAllocation } from './booking-inventory-allocation.entity';
// import { Organization } from './organization.entity';

@Entity('inventory_items')
@Index(['organizationId'])
@Index(['isActive'])
@Check('"unit_price" >= 0')
@Check('"quantity" >= 0')
@Check('"available_quantity" >= 0')
@Check('"available_quantity" <= "quantity"')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Column('int')
  quantity: number;

  @Column('int', { name: 'available_quantity' })
  availableQuantity: number;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string;

  // @ManyToOne('Organization', 'inventoryItems', {
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'organization_id' })
  // organization: Organization;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => BookingInventoryAllocation, allocation => allocation.inventoryItem)
  bookingAllocations: BookingInventoryAllocation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  get allocatedQuantity(): number {
    return this.quantity - this.availableQuantity;
  }

  canAllocate(requestedQuantity: number): boolean {
    return this.isActive && this.availableQuantity >= requestedQuantity;
  }

  allocate(quantity: number): void {
    if (!this.canAllocate(quantity)) {
      throw new Error(
        `Cannot allocate ${quantity} items. Only ${this.availableQuantity} available.`
      );
    }
    this.availableQuantity -= quantity;
  }

  deallocate(quantity: number): void {
    const newAvailable = this.availableQuantity + quantity;
    if (newAvailable > this.quantity) {
      throw new Error(`Cannot deallocate ${quantity} items. Would exceed total quantity.`);
    }
    this.availableQuantity = newAvailable;
  }
}
