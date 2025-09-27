import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

// Import all entities from the correct paths
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { Permission } from '../database/entities/permission.entity';
import { InventoryItem } from '../database/entities/inventory-item.entity';
import { Event } from '../database/entities/event.entity';
import { Booking } from '../database/entities/booking.entity';
import { BookingExpense } from '../database/entities/booking-expense.entity';
import { BookingRevenue } from '../database/entities/booking-revenue.entity';
import { BookingInventoryAllocation } from '../database/entities/booking-inventory-allocation.entity';

// Import seed classes
import { InitialDataSeed } from '../database/seeds/initial-data.seed';
import { SampleDataSeed } from '../database/seeds/sample-data.seed';

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'event_booking',
    entities: [
      User,
      Role,
      Permission,
      InventoryItem,
      Event,
      Booking,
      BookingExpense,
      BookingRevenue,
      BookingInventoryAllocation,
    ],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established');

    // Run initial data seed (permissions, roles, admin user)
    const initialSeed = new InitialDataSeed(dataSource);
    await initialSeed.run();

    // Run sample data seed (sample inventory, events, bookings)
    const sampleSeed = new SampleDataSeed(dataSource);
    await sampleSeed.run();

    await dataSource.destroy();
    console.log('🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

runSeed();
