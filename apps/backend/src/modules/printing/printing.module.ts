import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintingController } from './printing.controller';
import { PrinterTestController } from './printer-test.controller';
import { PrinterService } from './services/printer.service';
import { Booking } from '../../database/entities/booking.entity';
import { PrintAudit } from '../../database/entities/print-audit.entity';
import { Organization } from '../../database/entities/organization.entity';
import { User } from '../../database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      PrintAudit,
      Organization,
      User,
    ]),
    AuthModule,
  ],
  controllers: [PrintingController, PrinterTestController],
  providers: [PrinterService],
  exports: [PrinterService],
})
export class PrintingModule {}
