import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { WinstonModule } from 'nest-winston';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { EmailModule } from './modules/email/email.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { EventsModule } from './modules/events/events.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { FinancialModule } from './modules/financial/financial.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { PaymentModule } from './modules/payments/payment.module';
import { FeaturePackagesModule } from './modules/feature-packages/feature-packages.module';
import { UserPermissionsModule } from './modules/user-permissions/user-permissions.module';
import { SettingsModule } from './modules/settings/settings.module';

import { createWinstonLogger } from './common/config/winston.config';
import { validationSchema } from './common/config/validation.schema';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    // Logging
    WinstonModule.forRoot({
      instance: createWinstonLogger(),
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          ttl: parseInt(process.env.RATE_LIMIT_TTL || '60') * 1000,
          limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100'),
        },
      ],
    }),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Background jobs
    BullModule.forRootAsync({
      useFactory: () => {
        const redisConfig: any = {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        };

        // Only add password if it exists and is not empty
        if (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.trim() !== '') {
          redisConfig.password = process.env.REDIS_PASSWORD;
        }

        return { redis: redisConfig };
      },
    }),

    // Database
    DatabaseModule,

    // Feature modules
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    OrganizationsModule,
    EmailModule,
    InventoryModule,
    EventsModule,
    BookingsModule,
    FinancialModule,
    NotificationsModule,
    DashboardModule,
    DocumentsModule,
    PaymentModule,
    FeaturePackagesModule,
    UserPermissionsModule,
    SettingsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
