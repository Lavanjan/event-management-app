import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThanOrEqual, In } from 'typeorm';
import { format, startOfMonth, endOfMonth, parseISO, differenceInDays } from 'date-fns';

import { 
  Booking, 
  BookingExpense, 
  BookingRevenue, 
  PaymentStatus 
} from '../../database/entities';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { EmailService } from '../email/email.service';
import { 
  CreatePaymentRecordDto,
  PaymentReminderDto,
  BulkPaymentReminderDto,
  ProcessRefundDto,
  ValidatePaymentDto,
  BulkUpdatePaymentStatusDto,
  PaymentType,
  PaymentMethod,
  ReminderTemplate,
} from './dto/payment.dto';

export interface PaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  type: PaymentType;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  reference?: string;
  notes?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentSummary {
  totalPending: number;
  totalAdvancePaid: number;
  totalFullyPaid: number;
  totalOverdue: number;
  pendingCount: number;
  advancePaidCount: number;
  fullyPaidCount: number;
  overdueCount: number;
  totalRevenue: number;
  averagePaymentTime: number;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(BookingExpense)
    private expenseRepository: Repository<BookingExpense>,
    @InjectRepository(BookingRevenue)
    private revenueRepository: Repository<BookingRevenue>,
    private emailService: EmailService,
  ) {}

  async getPaymentSummary(
    paginationDto: PaginationDto,
    organizationId: string
  ): Promise<{ success: boolean; data: PaymentSummary }> {
    const { search, sortBy = 'createdAt', sortOrder = 'DESC' } = paginationDto;

    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.event', 'event')
      .where('booking.organizationId = :organizationId', { organizationId });

    if (search) {
      queryBuilder.andWhere(
        '(booking.customerName ILIKE :search OR booking.customerEmail ILIKE :search OR event.name ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const bookings = await queryBuilder.getMany();

    // Calculate statistics
    const pending = bookings.filter(b => b.paymentStatus === PaymentStatus.PENDING);
    const advancePaid = bookings.filter(b => b.paymentStatus === PaymentStatus.ADVANCE_PAID);
    const fullyPaid = bookings.filter(b => b.paymentStatus === PaymentStatus.FULLY_PAID);
    const overdue = bookings.filter(b => b.paymentStatus === PaymentStatus.OVERDUE);

    const totalPending = pending.reduce((sum, b) => sum + (b.advanceAmount || 0), 0);
    const totalAdvancePaid = advancePaid.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);
    const totalOverdue = overdue.reduce((sum, b) => sum + (b.balanceAmount || b.advanceAmount || 0), 0);
    const totalRevenue = fullyPaid.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // Calculate average payment time (simplified)
    const averagePaymentTime = fullyPaid.length > 0 
      ? fullyPaid.reduce((sum, b) => {
          if (b.createdAt && b.updatedAt) {
            return sum + differenceInDays(b.updatedAt, b.createdAt);
          }
          return sum;
        }, 0) / fullyPaid.length
      : 0;

    const summary: PaymentSummary = {
      totalPending,
      totalAdvancePaid,
      totalFullyPaid: totalRevenue,
      totalOverdue,
      pendingCount: pending.length,
      advancePaidCount: advancePaid.length,
      fullyPaidCount: fullyPaid.length,
      overdueCount: overdue.length,
      totalRevenue,
      averagePaymentTime: Math.round(averagePaymentTime),
    };

    return {
      success: true,
      data: summary,
    };
  }

  async getOverduePayments(organizationId: string): Promise<{ success: boolean; data: Booking[] }> {
    const now = new Date();

    const overdueBookings = await this.bookingRepository.find({
      where: [
        {
          organizationId,
          paymentStatus: PaymentStatus.PENDING,
          advanceDueDate: LessThan(now),
        },
        {
          organizationId,
          paymentStatus: PaymentStatus.ADVANCE_PAID,
          balanceDueDate: LessThan(now),
        },
        {
          organizationId,
          paymentStatus: PaymentStatus.OVERDUE,
        },
      ],
      relations: ['event'],
      order: { advanceDueDate: 'ASC' },
    });

    return {
      success: true,
      data: overdueBookings,
    };
  }

  async getPaymentHistory(
    bookingId: string, 
    organizationId: string
  ): Promise<{ success: boolean; data: PaymentRecord[] }> {
    // For now, we'll simulate payment records based on booking revenues
    // In a real implementation, you'd have a separate PaymentRecord entity
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, organizationId },
      relations: ['revenues'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const paymentRecords: PaymentRecord[] = booking.revenues.map(revenue => ({
      id: revenue.id,
      bookingId: booking.id,
      amount: Number(revenue.amount),
      type: revenue.name.toLowerCase().includes('advance') ? PaymentType.ADVANCE : PaymentType.BALANCE,
      status: 'completed' as const,
      paymentMethod: PaymentMethod.OTHER,
      reference: `REV-${revenue.id.slice(0, 8)}`,
      notes: revenue.description || '',
      processedAt: revenue.createdAt,
      createdAt: revenue.createdAt,
      updatedAt: revenue.updatedAt,
    }));

    return {
      success: true,
      data: paymentRecords,
    };
  }

  async recordPayment(
    createPaymentDto: CreatePaymentRecordDto,
    organizationId: string
  ): Promise<{ success: boolean; data: PaymentRecord }> {
    const { bookingId, amount, type, paymentMethod, transactionId, reference, notes } = createPaymentDto;

    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, organizationId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Create a revenue record to represent the payment
    const revenue = this.revenueRepository.create({
      bookingId,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Payment`,
      amount,
      category: 'Payment',
      description: notes || `${type} payment ${reference ? `(${reference})` : ''}`,
    });

    const savedRevenue = await this.revenueRepository.save(revenue);

    // Update booking payment status based on payment type and amounts
    await this.updateBookingPaymentStatus(booking, type, amount);

    const paymentRecord: PaymentRecord = {
      id: savedRevenue.id,
      bookingId,
      amount,
      type,
      status: 'completed',
      paymentMethod,
      transactionId,
      reference,
      notes,
      processedAt: new Date(),
      createdAt: savedRevenue.createdAt,
      updatedAt: savedRevenue.updatedAt,
    };

    return {
      success: true,
      data: paymentRecord,
    };
  }

  private async updateBookingPaymentStatus(
    booking: Booking, 
    paymentType: PaymentType, 
    amount: number
  ): Promise<void> {
    if (paymentType === PaymentType.ADVANCE) {
      if (amount >= (booking.advanceAmount || 0)) {
        booking.paymentStatus = PaymentStatus.ADVANCE_PAID;
      }
    } else if (paymentType === PaymentType.BALANCE) {
      if (amount >= (booking.balanceAmount || 0)) {
        booking.paymentStatus = PaymentStatus.FULLY_PAID;
      }
    }

    await this.bookingRepository.save(booking);
  }

  async sendPaymentReminder(
    reminderDto: PaymentReminderDto,
    organizationId: string
  ): Promise<{ success: boolean; message: string }> {
    const { bookingId, customerEmail, customerName, eventName, amount, dueDate, type, template } = reminderDto;

    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, organizationId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const subject = this.getEmailSubject(template || ReminderTemplate.GENTLE, type);
    const emailContent = this.generateReminderEmail(
      customerName, 
      eventName, 
      amount, 
      dueDate, 
      type, 
      template || ReminderTemplate.GENTLE
    );

    try {
      await this.emailService.sendEmail({
        to: customerEmail,
        subject,
        html: emailContent,
      });

      return {
        success: true,
        message: 'Payment reminder sent successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to send payment reminder');
    }
  }

  private getEmailSubject(template: ReminderTemplate, type: PaymentType): string {
    const paymentTypeText = type === PaymentType.ADVANCE ? 'Advance' : 'Balance';
    
    switch (template) {
      case ReminderTemplate.GENTLE:
        return `Friendly Reminder: ${paymentTypeText} Payment Due`;
      case ReminderTemplate.URGENT:
        return `Urgent: ${paymentTypeText} Payment Overdue`;
      case ReminderTemplate.FINAL:
        return `Final Notice: ${paymentTypeText} Payment Required`;
      default:
        return `Payment Reminder: ${paymentTypeText} Payment Due`;
    }
  }

  private generateReminderEmail(
    customerName: string,
    eventName: string,
    amount: number,
    dueDate: string,
    type: PaymentType,
    template: ReminderTemplate
  ): string {
    const paymentTypeText = type === PaymentType.ADVANCE ? 'advance' : 'balance';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Reminder</h2>
        <p>Dear ${customerName},</p>

        <p>This is a ${template} reminder that your ${paymentTypeText} payment for <strong>${eventName}</strong> is due.</p>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Amount Due:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Due Date:</strong> ${format(parseISO(dueDate), 'MMMM dd, yyyy')}</p>
          <p><strong>Event:</strong> ${eventName}</p>
        </div>

        <p>Please contact us if you have any questions or need to discuss payment arrangements.</p>

        <p>Thank you for your business!</p>

        <p>Best regards,<br>Your Event Management Team</p>
      </div>
    `;
  }

  async sendBulkReminders(
    bulkReminderDto: BulkPaymentReminderDto,
    organizationId: string
  ): Promise<{ success: boolean; sent: number; failed: number; details: Array<{ bookingId: string; success: boolean; error?: string }> }> {
    const { bookingIds, template } = bulkReminderDto;

    const bookings = await this.bookingRepository.find({
      where: {
        id: In(bookingIds),
        organizationId
      },
      relations: ['event'],
    });

    const results = [];
    let sent = 0;
    let failed = 0;

    for (const booking of bookings) {
      try {
        const amount = booking.paymentStatus === PaymentStatus.PENDING
          ? booking.advanceAmount
          : booking.balanceAmount;

        const dueDate = booking.paymentStatus === PaymentStatus.PENDING
          ? booking.advanceDueDate
          : booking.balanceDueDate;

        const type = booking.paymentStatus === PaymentStatus.PENDING
          ? PaymentType.ADVANCE
          : PaymentType.BALANCE;

        if (amount && dueDate) {
          await this.sendPaymentReminder({
            bookingId: booking.id,
            customerEmail: booking.customerEmail,
            customerName: booking.customerName,
            eventName: booking.event?.name || 'Unknown Event',
            amount,
            dueDate: dueDate.toISOString(),
            type,
            template,
          }, organizationId);

          results.push({ bookingId: booking.id, success: true });
          sent++;
        } else {
          results.push({
            bookingId: booking.id,
            success: false,
            error: 'Missing payment amount or due date'
          });
          failed++;
        }
      } catch (error) {
        results.push({
          bookingId: booking.id,
          success: false,
          error: error.message
        });
        failed++;
      }
    }

    return {
      success: true,
      sent,
      failed,
      details: results,
    };
  }

  async processRefund(
    refundDto: ProcessRefundDto,
    organizationId: string
  ): Promise<{ success: boolean; refundId: string; amount: number; processedAt: string }> {
    const { bookingId, amount, reason } = refundDto;

    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, organizationId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Create a negative revenue record to represent the refund
    const refund = this.revenueRepository.create({
      bookingId,
      name: 'Refund',
      amount: -Math.abs(amount), // Ensure negative amount
      category: 'Refund',
      description: reason || 'Refund processed',
    });

    const savedRefund = await this.revenueRepository.save(refund);

    // Update booking payment status to refunded
    booking.paymentStatus = PaymentStatus.REFUNDED;
    await this.bookingRepository.save(booking);

    return {
      success: true,
      refundId: savedRefund.id,
      amount,
      processedAt: savedRefund.createdAt.toISOString(),
    };
  }

  async validatePayment(
    validateDto: ValidatePaymentDto,
    organizationId: string
  ): Promise<{ isValid: boolean; status: 'pending' | 'completed' | 'failed'; verifiedAmount: number; fees?: number; netAmount?: number }> {
    const { transactionId, amount } = validateDto;

    // This is a simplified validation - in a real implementation,
    // you'd integrate with payment processors like Stripe, PayPal, etc.

    // For demo purposes, we'll simulate validation
    const isValid = transactionId.startsWith('txn_') && amount > 0;
    const fees = amount * 0.029; // 2.9% processing fee
    const netAmount = amount - fees;

    return {
      isValid,
      status: isValid ? 'completed' : 'failed',
      verifiedAmount: amount,
      fees: isValid ? fees : undefined,
      netAmount: isValid ? netAmount : undefined,
    };
  }

  async bulkUpdatePaymentStatus(
    bulkUpdateDto: BulkUpdatePaymentStatusDto,
    organizationId: string
  ): Promise<{ success: boolean; updated: number; failed: number; details: Array<{ bookingId: string; success: boolean; error?: string }> }> {
    const { bookingIds, status } = bulkUpdateDto;

    const bookings = await this.bookingRepository.find({
      where: {
        id: In(bookingIds),
        organizationId
      },
    });

    const results = [];
    let updated = 0;
    let failed = 0;

    for (const booking of bookings) {
      try {
        booking.paymentStatus = status;
        await this.bookingRepository.save(booking);

        results.push({ bookingId: booking.id, success: true });
        updated++;
      } catch (error) {
        results.push({
          bookingId: booking.id,
          success: false,
          error: error.message
        });
        failed++;
      }
    }

    return {
      success: true,
      updated,
      failed,
      details: results,
    };
  }

  async getPaymentAnalytics(
    from?: string,
    to?: string,
    organizationId?: string
  ): Promise<{ success: boolean; data: any }> {
    const startDate = from ? parseISO(from) : startOfMonth(new Date());
    const endDate = to ? parseISO(to) : endOfMonth(new Date());

    const bookings = await this.bookingRepository.find({
      where: {
        organizationId,
        createdAt: Between(startDate, endDate),
      },
      relations: ['event', 'revenues'],
    });

    // Payment trends
    const paymentTrends = this.calculatePaymentTrends(bookings, startDate, endDate);

    // Payment status distribution
    const paymentStatusDistribution = this.calculatePaymentStatusDistribution(bookings);

    // Payment method breakdown (simplified)
    const paymentMethodBreakdown = [
      { method: 'Card', amount: 15000, percentage: 45 },
      { method: 'Bank Transfer', amount: 12000, percentage: 36 },
      { method: 'Cash', amount: 6000, percentage: 18 },
      { method: 'Other', amount: 300, percentage: 1 },
    ];

    return {
      success: true,
      data: {
        paymentTrends,
        paymentMethodBreakdown,
        averagePaymentTime: 7, // days
        paymentStatusDistribution,
        monthlyRecurring: bookings.length,
        seasonalTrends: this.calculateSeasonalTrends(bookings),
      },
    };
  }

  async getPaymentMethods(organizationId: string): Promise<{ success: boolean; data: any[] }> {
    // In a real implementation, this would come from a database
    const paymentMethods = [
      {
        id: '1',
        name: 'Credit Card',
        type: PaymentMethod.CARD,
        isActive: true,
        processingFee: 2.9,
      },
      {
        id: '2',
        name: 'Bank Transfer',
        type: PaymentMethod.BANK_TRANSFER,
        isActive: true,
        processingFee: 0.5,
      },
      {
        id: '3',
        name: 'Cash',
        type: PaymentMethod.CASH,
        isActive: true,
        processingFee: 0,
      },
      {
        id: '4',
        name: 'Check',
        type: PaymentMethod.CHECK,
        isActive: false,
        processingFee: 0,
      },
    ];

    return {
      success: true,
      data: paymentMethods,
    };
  }

  async getPaymentCalendar(
    month: string,
    year: string,
    organizationId: string
  ): Promise<{ success: boolean; data: any[] }> {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const bookings = await this.bookingRepository.find({
      where: [
        {
          organizationId,
          advanceDueDate: Between(startDate, endDate),
        },
        {
          organizationId,
          balanceDueDate: Between(startDate, endDate),
        },
      ],
      relations: ['event'],
    });

    const calendarData = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayBookings = bookings.filter(booking => {
        const advanceDue = booking.advanceDueDate && format(booking.advanceDueDate, 'yyyy-MM-dd') === dateStr;
        const balanceDue = booking.balanceDueDate && format(booking.balanceDueDate, 'yyyy-MM-dd') === dateStr;
        return advanceDue || balanceDue;
      });

      const payments = dayBookings.map(booking => {
        const isAdvanceDue = booking.advanceDueDate && format(booking.advanceDueDate, 'yyyy-MM-dd') === dateStr;
        return {
          bookingId: booking.id,
          customerName: booking.customerName,
          eventName: booking.event?.name || 'Unknown Event',
          amount: isAdvanceDue ? booking.advanceAmount : booking.balanceAmount,
          type: isAdvanceDue ? 'advance' : 'balance',
          status: booking.paymentStatus,
        };
      });

      calendarData.push({
        date: dateStr,
        payments,
        totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        count: payments.length,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      success: true,
      data: calendarData,
    };
  }

  async generatePaymentReport(
    paginationDto: PaginationDto,
    format: 'pdf' | 'excel',
    organizationId: string
  ): Promise<{ success: boolean; data: any }> {
    // This would generate actual reports in a real implementation
    return {
      success: true,
      data: {
        message: `${format.toUpperCase()} report generation not implemented yet`,
        format,
        organizationId,
      },
    };
  }

  async exportPayments(
    paginationDto: PaginationDto,
    format: 'csv' | 'xlsx',
    organizationId: string
  ): Promise<{ success: boolean; data: any }> {
    // This would export actual data in a real implementation
    return {
      success: true,
      data: {
        message: `${format.toUpperCase()} export not implemented yet`,
        format,
        organizationId,
      },
    };
  }

  private calculatePaymentTrends(bookings: Booking[], startDate: Date, endDate: Date): any[] {
    // Simplified payment trends calculation
    const trends = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayBookings = bookings.filter(b =>
        format(b.createdAt, 'yyyy-MM-dd') === dateStr
      );

      trends.push({
        date: dateStr,
        amount: dayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
        count: dayBookings.length,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trends;
  }

  private calculatePaymentStatusDistribution(bookings: Booking[]): any[] {
    const statusCounts = {
      [PaymentStatus.PENDING]: 0,
      [PaymentStatus.ADVANCE_PAID]: 0,
      [PaymentStatus.FULLY_PAID]: 0,
      [PaymentStatus.OVERDUE]: 0,
      [PaymentStatus.REFUNDED]: 0,
    };

    bookings.forEach(booking => {
      statusCounts[booking.paymentStatus]++;
    });

    const total = bookings.length;

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }

  private calculateSeasonalTrends(bookings: Booking[]): any[] {
    const monthlyData = {};

    bookings.forEach(booking => {
      const month = format(booking.createdAt, 'MMM');
      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month] += booking.totalAmount || 0;
    });

    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount,
    }));
  }
}
