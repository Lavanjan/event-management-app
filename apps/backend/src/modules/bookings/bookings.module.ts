import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from '../../database/entities/booking.entity';
import { BookingInventoryAllocation } from '../../database/entities/booking-inventory-allocation.entity';
import { BookingExpense } from '../../database/entities/booking-expense.entity';
import { BookingRevenue } from '../../database/entities/booking-revenue.entity';
import { Event } from '../../database/entities/event.entity';
import { InventoryItem } from '../../database/entities/inventory-item.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { EventsModule } from '../events/events.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingInventoryAllocation,
      BookingExpense,
      BookingRevenue,
      Event,
      InventoryItem,
    ]),
    InventoryModule,
    EventsModule,
    AuthModule,
    EmailModule,
    DocumentsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
