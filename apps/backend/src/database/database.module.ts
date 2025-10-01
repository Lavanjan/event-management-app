import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User,
  Role,
  Permission,
  Organization,
  OrganizationPermission,
  InventoryItem,
  InventoryCategory,
  Event,
  Booking,
  BookingInventoryAllocation,
  BookingExpense,
  BookingRevenue,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'event_booking'),
        entities: [
          User,
          Role,
          Permission,
          Organization,
          OrganizationPermission,
          InventoryItem,
          InventoryCategory,
          Event,
          Booking,
          BookingInventoryAllocation,
          BookingExpense,
          BookingRevenue,
        ],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false, // Disabled to use migrations instead
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
