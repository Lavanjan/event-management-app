import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Booking } from '../../database/entities/booking.entity';
import { BookingExpense } from '../../database/entities/booking-expense.entity';
import { BookingRevenue } from '../../database/entities/booking-revenue.entity';

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(BookingExpense)
    private expenseRepository: Repository<BookingExpense>,
    @InjectRepository(BookingRevenue)
    private revenueRepository: Repository<BookingRevenue>
  ) {}

  async getFinancialSummary(
    from?: string,
    to?: string
  ): Promise<{
    success: boolean;
    data: {
      totalRevenue: number;
      totalExpenses: number;
      netProfit: number;
      profitMargin: number;
      totalBookings: number;
      averageBookingValue: number;
      expensesByCategory: Array<{
        name: string;
        amount: number;
        percentage: number;
      }>;
      recentTransactions: Array<{
        id: string;
        description: string;
        amount: number;
        type: 'revenue' | 'expense';
        category: string;
        date: string;
      }>;
    };
  }> {
    const whereClause: any = {};
    if (from || to) {
      whereClause.createdAt = {};
      if (from) whereClause.createdAt.gte = new Date(from);
      if (to) whereClause.createdAt.lte = new Date(to);
    }

    const bookings = await this.bookingRepository.find({
      where: whereClause,
      relations: ['expenses', 'revenues'],
      order: { createdAt: 'DESC' },
    });

    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalRevenues, 0);
    const totalExpenses = bookings.reduce((sum, booking) => sum + booking.totalExpenses, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const totalBookings = bookings.length;
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Mock expense categories for now
    const expensesByCategory = [
      { name: 'Venue', amount: totalExpenses * 0.4, percentage: 40 },
      { name: 'Catering', amount: totalExpenses * 0.3, percentage: 30 },
      { name: 'Equipment', amount: totalExpenses * 0.2, percentage: 20 },
      { name: 'Staff', amount: totalExpenses * 0.1, percentage: 10 },
    ];

    // Mock recent transactions
    const recentTransactions = bookings.slice(0, 10).map(booking => ({
      id: booking.id,
      description: `Booking for ${booking.customerName}`,
      amount: booking.totalAmount,
      type: 'revenue' as const,
      category: 'Booking Payment',
      date: booking.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalBookings,
        averageBookingValue,
        expensesByCategory,
        recentTransactions,
      },
    };
  }

  async getRevenueReport(from?: string, to?: string): Promise<{ success: boolean; data: any }> {
    const whereClause: any = {};
    if (from || to) {
      whereClause.createdAt = {};
      if (from) whereClause.createdAt.gte = new Date(from);
      if (to) whereClause.createdAt.lte = new Date(to);
    }

    const bookings = await this.bookingRepository.find({
      where: whereClause,
      relations: ['revenues'],
      order: { createdAt: 'DESC' },
    });

    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalRevenues, 0);
    const revenueByMonth = {}; // TODO: Implement monthly breakdown

    return {
      success: true,
      data: {
        totalRevenue,
        bookingCount: bookings.length,
        averageRevenue: bookings.length > 0 ? totalRevenue / bookings.length : 0,
        revenueByMonth,
        bookings: bookings.slice(0, 20),
      },
    };
  }

  async getExpenseReport(from?: string, to?: string): Promise<{ success: boolean; data: any }> {
    const whereClause: any = {};
    if (from || to) {
      whereClause.createdAt = {};
      if (from) whereClause.createdAt.gte = new Date(from);
      if (to) whereClause.createdAt.lte = new Date(to);
    }

    const bookings = await this.bookingRepository.find({
      where: whereClause,
      relations: ['expenses'],
      order: { createdAt: 'DESC' },
    });

    const totalExpenses = bookings.reduce((sum, booking) => sum + booking.totalExpenses, 0);
    const expensesByCategory = {}; // TODO: Implement category breakdown

    return {
      success: true,
      data: {
        totalExpenses,
        bookingCount: bookings.length,
        averageExpense: bookings.length > 0 ? totalExpenses / bookings.length : 0,
        expensesByCategory,
        bookings: bookings.slice(0, 20),
      },
    };
  }

  async exportReport(
    format: 'pdf' | 'excel',
    from?: string,
    to?: string
  ): Promise<{ success: boolean; data: any }> {
    // TODO: Implement actual export functionality
    return {
      success: true,
      data: {
        message: `${format.toUpperCase()} export functionality will be implemented`,
        format,
        dateRange: { from, to },
      },
    };
  }
}
