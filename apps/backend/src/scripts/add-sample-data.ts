import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InventoryItem } from '../database/entities/inventory-item.entity';
import { Event } from '../database/entities/event.entity';
import { Booking, BookingStatus, PaymentStatus } from '../database/entities/booking.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

async function addSampleData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const inventoryRepository = app.get<Repository<InventoryItem>>(
    getRepositoryToken(InventoryItem),
  );
  const eventRepository = app.get<Repository<Event>>(
    getRepositoryToken(Event),
  );
  const bookingRepository = app.get<Repository<Booking>>(
    getRepositoryToken(Booking),
  );

  console.log('Adding sample inventory items...');

  // Add sample inventory items
  const inventoryItems = [
    {
      name: 'Round Tables (8-person)',
      description: 'Standard round tables that seat 8 people',
      unitPrice: 25.00,
      quantity: 50,
      availableQuantity: 45,
    },
    {
      name: 'Chiavari Chairs',
      description: 'Elegant gold chiavari chairs',
      unitPrice: 8.50,
      quantity: 400,
      availableQuantity: 380,
    },
    {
      name: 'Sound System Package',
      description: 'Complete sound system with microphones',
      unitPrice: 150.00,
      quantity: 10,
      availableQuantity: 8,
    },
    {
      name: 'LED Uplighting',
      description: 'Color-changing LED uplighting fixtures',
      unitPrice: 35.00,
      quantity: 100,
      availableQuantity: 85,
    },
    {
      name: 'Dance Floor (20x20)',
      description: 'Portable dance floor sections',
      unitPrice: 200.00,
      quantity: 5,
      availableQuantity: 4,
    },
    {
      name: 'Linens - White',
      description: 'Premium white table linens',
      unitPrice: 12.00,
      quantity: 100,
      availableQuantity: 2, // Low stock
    },
    {
      name: 'Centerpiece - Floral',
      description: 'Elegant floral centerpieces',
      unitPrice: 45.00,
      quantity: 30,
      availableQuantity: 25,
    },
    {
      name: 'Projector & Screen',
      description: 'HD projector with 10ft screen',
      unitPrice: 120.00,
      quantity: 8,
      availableQuantity: 1, // Low stock
    },
  ];

  for (const item of inventoryItems) {
    const existingItem = await inventoryRepository.findOne({
      where: { name: item.name },
    });

    if (!existingItem) {
      await inventoryRepository.save(inventoryRepository.create(item));
      console.log(`Added inventory item: ${item.name}`);
    }
  }

  console.log('Adding sample events...');

  // Add sample events
  const events = [
    {
      name: 'Corporate Annual Gala 2025',
      description: 'Annual corporate celebration with dinner and awards ceremony',
      startDate: new Date('2025-12-15T18:00:00Z'),
      endDate: new Date('2025-12-15T23:00:00Z'),
      location: 'Grand Ballroom, Downtown Hotel',
      maxAttendees: 200,
      requiredAdvancePercentage: 50,
      balancePaymentWindowDays: 14,
    },
    {
      name: 'Wedding Reception - Smith & Johnson',
      description: 'Elegant wedding reception with dinner and dancing',
      startDate: new Date('2025-11-20T17:00:00Z'),
      endDate: new Date('2025-11-20T23:30:00Z'),
      location: 'Garden Pavilion, Riverside Venue',
      maxAttendees: 150,
      requiredAdvancePercentage: 60,
      balancePaymentWindowDays: 7,
    },
    {
      name: 'Tech Conference 2025',
      description: 'Annual technology conference with keynote speakers',
      startDate: new Date('2025-10-10T09:00:00Z'),
      endDate: new Date('2025-10-10T17:00:00Z'),
      location: 'Convention Center, Tech District',
      maxAttendees: 500,
      requiredAdvancePercentage: 40,
      balancePaymentWindowDays: 21,
    },
    {
      name: 'Birthday Celebration - 50th',
      description: 'Milestone birthday celebration with family and friends',
      startDate: new Date('2025-09-30T19:00:00Z'),
      endDate: new Date('2025-09-30T23:00:00Z'),
      location: 'Private Residence, Westside',
      maxAttendees: 80,
      requiredAdvancePercentage: 50,
      balancePaymentWindowDays: 10,
    },
  ];

  for (const event of events) {
    const existingEvent = await eventRepository.findOne({
      where: { name: event.name },
    });

    if (!existingEvent) {
      const savedEvent = await eventRepository.save(eventRepository.create(event));
      console.log(`Added event: ${event.name}`);

      // Add sample bookings for some events
      if (event.name.includes('Wedding') || event.name.includes('Birthday')) {
        const booking = {
          eventId: savedEvent.id,
          customerName: event.name.includes('Wedding') ? 'Sarah Smith' : 'Michael Johnson',
          customerEmail: event.name.includes('Wedding') ? 'sarah.smith@email.com' : 'michael.j@email.com',
          customerPhone: event.name.includes('Wedding') ? '+1-555-0123' : '+1-555-0456',
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.ADVANCE_PAID,
          totalAmount: event.name.includes('Wedding') ? 8500.00 : 3200.00,
          advanceAmount: event.name.includes('Wedding') ? 5100.00 : 1600.00,
          balanceAmount: event.name.includes('Wedding') ? 3400.00 : 1600.00,
          advanceDueDate: new Date('2025-09-01'),
          balanceDueDate: new Date('2025-11-13'), // Past due for testing
          notes: 'Confirmed booking with advance payment received',
        };

        await bookingRepository.save(bookingRepository.create(booking));
        console.log(`Added booking for: ${event.name}`);
      }
    }
  }

  console.log('Sample data added successfully!');
  await app.close();
}

addSampleData().catch((error) => {
  console.error('Error adding sample data:', error);
  process.exit(1);
});
