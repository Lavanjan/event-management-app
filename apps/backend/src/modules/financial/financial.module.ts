import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Booking } from '../../database/entities/booking.entity';
import { BookingExpense } from '../../database/entities/booking-expense.entity';
import { BookingRevenue } from '../../database/entities/booking-revenue.entity';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, BookingExpense, BookingRevenue]),
    AuthModule,
    EmailModule,
  ],
  controllers: [FinancialController, PaymentsController],
  providers: [FinancialService, PaymentsService],
  exports: [FinancialService, PaymentsService],
})
export class FinancialModule {}
