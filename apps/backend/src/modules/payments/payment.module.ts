import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from '../../database/entities/payment.entity';
import { PaymentPlan } from '../../database/entities/payment-plan.entity';
import { PaymentTransaction } from '../../database/entities/payment-transaction.entity';
import { Booking } from '../../database/entities/booking.entity';
import { User } from '../../database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      PaymentPlan,
      PaymentTransaction,
      Booking,
      User,
    ]),
    AuthModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
