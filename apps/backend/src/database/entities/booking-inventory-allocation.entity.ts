import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Booking } from './booking.entity';
import { InventoryItem } from './inventory-item.entity';

@Entity('booking_inventory_allocations')
@Check('"quantity" > 0')
@Check('"unit_price" >= 0')
@Check('"total_price" >= 0')
export class BookingInventoryAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking, booking => booking.inventoryAllocations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'inventory_item_id' })
  inventoryItemId: string;

  @ManyToOne(() => InventoryItem, item => item.bookingAllocations, {
    eager: true,
  })
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem: InventoryItem;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  calculateTotalPrice() {
    this.totalPrice = this.quantity * this.unitPrice;
  }
}
