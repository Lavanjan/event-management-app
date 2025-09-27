import { DataSource } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { Permission } from '../database/entities/permission.entity';
import { InventoryItem } from '../database/entities/inventory-item.entity';
import { Event } from '../database/entities/event.entity';
import { Booking } from '../database/entities/booking.entity';
import { BookingExpense } from '../database/entities/booking-expense.entity';
import { BookingRevenue } from '../database/entities/booking-revenue.entity';
import { BookingInventoryAllocation } from '../database/entities/booking-inventory-allocation.entity';
import * as bcrypt from 'bcrypt';

async function updateTestUser() {
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

    const userRepository = dataSource.getRepository(User);
    const roleRepository = dataSource.getRepository(Role);

    // Find the test user
    const testUser = await userRepository.findOne({
      where: { email: 'test@example.com' },
      relations: ['roles'],
    });

    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    // Find the admin role
    const adminRole = await roleRepository.findOne({
      where: { name: 'Product Admin' },
    });

    if (!adminRole) {
      console.log('❌ Admin role not found');
      return;
    }

    // Update password to Admin@123
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    testUser.password = hashedPassword;

    // Assign admin role if not already assigned
    if (!testUser.roles.some(role => role.id === adminRole.id)) {
      testUser.roles.push(adminRole);
    }

    await userRepository.save(testUser);

    console.log('✅ Test user updated successfully');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: Admin@123');
    console.log('👤 Role: Product Admin');

    await dataSource.destroy();
    console.log('🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating test user:', error);
    process.exit(1);
  }
}

updateTestUser();
