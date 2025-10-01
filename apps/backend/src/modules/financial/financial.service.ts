import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

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
    to?: string,
    organizationId?: string
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

    // Add organization filter
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    // Add date filters
    if (from && to) {
      whereClause.createdAt = Between(new Date(from), new Date(to));
    } else if (from) {
      whereClause.createdAt = MoreThanOrEqual(new Date(from));
    } else if (to) {
      whereClause.createdAt = LessThanOrEqual(new Date(to));
    }

    const bookings = await this.bookingRepository.find({
      where: whereClause,
      relations: ['expenses', 'revenues'],
      order: { createdAt: 'DESC' },
    });

    // Calculate real totals from actual expenses and revenues
    const totalRevenue = bookings.reduce((sum, booking) => {
      const bookingRevenue =
        booking.revenues?.reduce((revSum, revenue) => revSum + Number(revenue.amount), 0) || 0;
      return sum + bookingRevenue;
    }, 0);

    const totalExpenses = bookings.reduce((sum, booking) => {
      const bookingExpenses =
        booking.expenses?.reduce((expSum, expense) => expSum + Number(expense.amount), 0) || 0;
      return sum + bookingExpenses;
    }, 0);

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const totalBookings = bookings.length;
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Real expense categories from actual data
    const expenseCategoryMap = new Map<string, number>();
    bookings.forEach(booking => {
      booking.expenses?.forEach(expense => {
        const category = expense.category || 'Other';
        expenseCategoryMap.set(
          category,
          (expenseCategoryMap.get(category) || 0) + Number(expense.amount)
        );
      });
    });

    const expensesByCategory = Array.from(expenseCategoryMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Real recent transactions from both revenues and expenses
    const recentTransactions: any[] = [];

    // Add revenue transactions
    bookings.forEach(booking => {
      booking.revenues?.forEach(revenue => {
        recentTransactions.push({
          id: revenue.id,
          description: revenue.description || `Revenue for ${booking.customerName}`,
          amount: Number(revenue.amount),
          type: 'revenue' as const,
          category: revenue.category || 'Revenue',
          date: revenue.createdAt.toISOString(),
          bookingId: booking.id,
          customerName: booking.customerName,
        });
      });
    });

    // Add expense transactions
    bookings.forEach(booking => {
      booking.expenses?.forEach(expense => {
        recentTransactions.push({
          id: expense.id,
          description: expense.description || `Expense for ${booking.customerName}`,
          amount: Number(expense.amount),
          type: 'expense' as const,
          category: expense.category || 'Expense',
          date: expense.createdAt.toISOString(),
          bookingId: booking.id,
          customerName: booking.customerName,
        });
      });
    });

    // Sort by date (most recent first) and limit to 10
    recentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const limitedTransactions = recentTransactions.slice(0, 10);

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
        recentTransactions: limitedTransactions,
      },
    };
  }

  async getRevenueReport(
    from?: string,
    to?: string,
    organizationId?: string
  ): Promise<{ success: boolean; data: any }> {
    const whereClause: any = {};

    // Add organization filter
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    // Add date filters
    if (from && to) {
      whereClause.createdAt = Between(new Date(from), new Date(to));
    } else if (from) {
      whereClause.createdAt = MoreThanOrEqual(new Date(from));
    } else if (to) {
      whereClause.createdAt = LessThanOrEqual(new Date(to));
    }

    const bookings = await this.bookingRepository.find({
      where: whereClause,
      relations: ['revenues'],
      order: { createdAt: 'DESC' },
    });

    // Calculate real revenue from actual revenue records
    const totalRevenue = bookings.reduce((sum, booking) => {
      const bookingRevenue =
        booking.revenues?.reduce((revSum, revenue) => revSum + Number(revenue.amount), 0) || 0;
      return sum + bookingRevenue;
    }, 0);

    // Real revenue breakdown by month
    const revenueByMonth = new Map<string, number>();
    bookings.forEach(booking => {
      booking.revenues?.forEach(revenue => {
        const monthKey = new Date(revenue.createdAt).toISOString().substring(0, 7); // YYYY-MM
        revenueByMonth.set(monthKey, (revenueByMonth.get(monthKey) || 0) + Number(revenue.amount));
      });
    });

    // Convert to array format for frontend
    const revenueByMonthArray = Array.from(revenueByMonth.entries())
      .map(([month, amount]) => ({
        month,
        amount,
        label: new Date(month + '-01').toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
        }),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Real revenue breakdown by category
    const revenueByCategoryMap = new Map<string, number>();
    bookings.forEach(booking => {
      booking.revenues?.forEach(revenue => {
        const category = revenue.category || 'Other';
        revenueByCategoryMap.set(
          category,
          (revenueByCategoryMap.get(category) || 0) + Number(revenue.amount)
        );
      });
    });

    const revenueByCategory = Array.from(revenueByCategoryMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Detailed revenue transactions
    const revenueTransactions: any[] = [];
    bookings.forEach(booking => {
      booking.revenues?.forEach(revenue => {
        revenueTransactions.push({
          id: revenue.id,
          description: revenue.description || `Revenue for ${booking.customerName}`,
          amount: Number(revenue.amount),
          category: revenue.category || 'Revenue',
          date: revenue.createdAt.toISOString(),
          bookingId: booking.id,
          customerName: booking.customerName,
        });
      });
    });

    revenueTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      success: true,
      data: {
        totalRevenue,
        bookingCount: bookings.length,
        averageRevenue: bookings.length > 0 ? totalRevenue / bookings.length : 0,
        revenueByMonth: revenueByMonthArray,
        revenueByCategory,
        revenueTransactions: revenueTransactions.slice(0, 50),
        bookings: bookings.slice(0, 20),
      },
    };
  }

  async getExpenseReport(
    from?: string,
    to?: string,
    organizationId?: string
  ): Promise<{ success: boolean; data: any }> {
    const whereClause: any = {};

    // Add organization filter
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    // Add date filters
    if (from && to) {
      whereClause.createdAt = Between(new Date(from), new Date(to));
    } else if (from) {
      whereClause.createdAt = MoreThanOrEqual(new Date(from));
    } else if (to) {
      whereClause.createdAt = LessThanOrEqual(new Date(to));
    }

    const bookings = await this.bookingRepository.find({
      where: whereClause,
      relations: ['expenses'],
      order: { createdAt: 'DESC' },
    });

    // Calculate real expenses from actual expense records
    const totalExpenses = bookings.reduce((sum, booking) => {
      const bookingExpenses =
        booking.expenses?.reduce((expSum, expense) => expSum + Number(expense.amount), 0) || 0;
      return sum + bookingExpenses;
    }, 0);

    // Real expense breakdown by month
    const expensesByMonth = new Map<string, number>();
    bookings.forEach(booking => {
      booking.expenses?.forEach(expense => {
        const monthKey = new Date(expense.createdAt).toISOString().substring(0, 7); // YYYY-MM
        expensesByMonth.set(
          monthKey,
          (expensesByMonth.get(monthKey) || 0) + Number(expense.amount)
        );
      });
    });

    // Convert to array format for frontend
    const expensesByMonthArray = Array.from(expensesByMonth.entries())
      .map(([month, amount]) => ({
        month,
        amount,
        label: new Date(month + '-01').toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
        }),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Real expense breakdown by category
    const expensesByCategoryMap = new Map<string, number>();
    bookings.forEach(booking => {
      booking.expenses?.forEach(expense => {
        const category = expense.category || 'Other';
        expensesByCategoryMap.set(
          category,
          (expensesByCategoryMap.get(category) || 0) + Number(expense.amount)
        );
      });
    });

    const expensesByCategory = Array.from(expensesByCategoryMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Detailed expense transactions
    const expenseTransactions: any[] = [];
    bookings.forEach(booking => {
      booking.expenses?.forEach(expense => {
        expenseTransactions.push({
          id: expense.id,
          description: expense.description || `Expense for ${booking.customerName}`,
          amount: Number(expense.amount),
          category: expense.category || 'Expense',
          date: expense.createdAt.toISOString(),
          bookingId: booking.id,
          customerName: booking.customerName,
        });
      });
    });

    expenseTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      success: true,
      data: {
        totalExpenses,
        bookingCount: bookings.length,
        averageExpense: bookings.length > 0 ? totalExpenses / bookings.length : 0,
        expensesByMonth: expensesByMonthArray,
        expensesByCategory,
        expenseTransactions: expenseTransactions.slice(0, 50),
        bookings: bookings.slice(0, 20),
      },
    };
  }

  async getProfitLossReport(
    from?: string,
    to?: string,
    organizationId?: string
  ): Promise<{ success: boolean; data: any }> {
    const whereClause: any = {};

    // Add organization filter
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    // Add date filters
    if (from && to) {
      whereClause.createdAt = Between(new Date(from), new Date(to));
    } else if (from) {
      whereClause.createdAt = MoreThanOrEqual(new Date(from));
    } else if (to) {
      whereClause.createdAt = LessThanOrEqual(new Date(to));
    }

    const bookings = await this.bookingRepository.find({
      where: whereClause,
      relations: ['expenses', 'revenues'],
      order: { createdAt: 'DESC' },
    });

    // Calculate totals
    const totalRevenue = bookings.reduce((sum, booking) => {
      const bookingRevenue =
        booking.revenues?.reduce((revSum, revenue) => revSum + Number(revenue.amount), 0) || 0;
      return sum + bookingRevenue;
    }, 0);

    const totalExpenses = bookings.reduce((sum, booking) => {
      const bookingExpenses =
        booking.expenses?.reduce((expSum, expense) => expSum + Number(expense.amount), 0) || 0;
      return sum + bookingExpenses;
    }, 0);

    const grossProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Monthly profit/loss breakdown
    const monthlyProfitLoss = new Map<
      string,
      { revenue: number; expenses: number; profit: number }
    >();

    bookings.forEach(booking => {
      const monthKey = new Date(booking.createdAt).toISOString().substring(0, 7); // YYYY-MM

      if (!monthlyProfitLoss.has(monthKey)) {
        monthlyProfitLoss.set(monthKey, { revenue: 0, expenses: 0, profit: 0 });
      }

      const monthData = monthlyProfitLoss.get(monthKey)!;

      // Add revenues
      const bookingRevenue =
        booking.revenues?.reduce((sum, revenue) => sum + Number(revenue.amount), 0) || 0;
      monthData.revenue += bookingRevenue;

      // Add expenses
      const bookingExpenses =
        booking.expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
      monthData.expenses += bookingExpenses;

      // Calculate profit
      monthData.profit = monthData.revenue - monthData.expenses;
    });

    const monthlyProfitLossArray = Array.from(monthlyProfitLoss.entries())
      .map(([month, data]) => ({
        month,
        ...data,
        profitMargin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
        label: new Date(month + '-01').toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
        }),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        grossProfit,
        profitMargin,
        bookingCount: bookings.length,
        averageProfit: bookings.length > 0 ? grossProfit / bookings.length : 0,
        monthlyProfitLoss: monthlyProfitLossArray,
        dateRange: { from, to },
      },
    };
  }

  async exportReport(
    format: 'pdf' | 'excel',
    from?: string,
    to?: string,
    organizationId?: string
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
