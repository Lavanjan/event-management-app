import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from '../../database/entities/inventory-item.entity';
import { Event } from '../../database/entities/event.entity';
import { Booking, BookingPaymentStatus } from '../../database/entities/booking.entity';
import { BookingExpense } from '../../database/entities/booking-expense.entity';
import { BookingRevenue } from '../../database/entities/booking-revenue.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(BookingExpense)
    private expenseRepository: Repository<BookingExpense>,
    @InjectRepository(BookingRevenue)
    private revenueRepository: Repository<BookingRevenue>
  ) {}

  async getStats(organizationId: string) {
    const [
      totalInventoryItems,
      totalInventoryValue,
      activeEvents,
      totalBookings,
      totalRevenue,
      totalExpenses,
      lowStockItems,
      overduePayments,
    ] = await Promise.all([
      this.inventoryRepository.count({ where: { isActive: true, organizationId } }),
      this.inventoryRepository
        .createQueryBuilder('item')
        .select('SUM(item.unitPrice * item.quantity)', 'total')
        .where('item.isActive = :isActive AND item.organizationId = :organizationId', { isActive: true, organizationId })
        .getRawOne()
        .then(result => parseFloat(result.total) || 0),
      this.eventRepository.count({ where: { isActive: true, organizationId } }),
      this.bookingRepository.count({ where: { organizationId } }),
      this.revenueRepository
        .createQueryBuilder('revenue')
        .leftJoin('revenue.booking', 'booking')
        .select('SUM(revenue.amount)', 'total')
        .where('booking.organizationId = :organizationId', { organizationId })
        .getRawOne()
        .then(result => parseFloat(result.total) || 0),
      this.expenseRepository
        .createQueryBuilder('expense')
        .leftJoin('expense.booking', 'booking')
        .select('SUM(expense.amount)', 'total')
        .where('booking.organizationId = :organizationId', { organizationId })
        .getRawOne()
        .then(result => parseFloat(result.total) || 0),
      this.inventoryRepository.count({
        where: { availableQuantity: 5, isActive: true, organizationId }, // Less than or equal to 5
      }),
      this.bookingRepository.count({
        where: { paymentStatus: BookingPaymentStatus.OVERDUE, organizationId },
      }),
    ]);

    const totalProfit = totalRevenue - totalExpenses;

    return {
      success: true,
      data: {
        overview: {
          totalInventoryItems,
          totalInventoryValue,
          activeEvents,
          totalBookings,
          totalRevenue,
          totalProfit,
          lowStockItems,
          overduePayments,
        },
      },
    };
  }

  async getChartData(period: '7d' | '30d' | '90d' | '1y' = '30d', organizationId: string) {
    // For now, return mock data
    return {
      success: true,
      data: {
        revenue: [],
        bookingsByStatus: [
          { status: 'confirmed', count: 15, percentage: 60 },
          { status: 'pending', count: 8, percentage: 32 },
          { status: 'cancelled', count: 2, percentage: 8 },
        ],
        inventoryByCategory: [],
        monthlyTrends: [],
      },
    };
  }

  async getRecentActivity(limit: number = 10, organizationId: string) {
    // Get recent bookings as activity
    const recentBookings = await this.bookingRepository.find({
      where: { organizationId },
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['event'],
    });

    const activity = recentBookings.map(booking => ({
      id: booking.id,
      type: 'booking_created' as const,
      title: `New booking created`,
      description: `Booking for ${booking.event?.name || 'Unknown Event'} by ${
        booking.customerName
      }`,
      timestamp: booking.createdAt.toISOString(),
      user: booking.customerName,
      amount: booking.totalAmount,
    }));

    return {
      success: true,
      data: activity,
    };
  }

  async getUpcomingEvents(limit: number = 5, organizationId: string) {
    const upcomingEvents = await this.eventRepository.find({
      where: { isActive: true, organizationId },
      take: limit,
      order: { startDate: 'ASC' },
    });

    const eventsWithBookings = await Promise.all(
      upcomingEvents.map(async event => {
        const bookingsCount = await this.bookingRepository.count({
          where: { eventId: event.id, organizationId },
        });

        return {
          id: event.id,
          name: event.name,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
          location: event.location || 'TBD',
          bookingsCount,
          status: 'active',
        };
      })
    );

    return {
      success: true,
      data: eventsWithBookings,
    };
  }

  async getRecentBookings(limit: number = 10, organizationId: string) {
    const recentBookings = await this.bookingRepository.find({
      where: { organizationId },
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['event'],
    });

    const bookingsData = recentBookings.map(booking => ({
      id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      eventName: booking.event?.name || 'Unknown Event',
      totalAmount: booking.totalAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: bookingsData,
    };
  }

  async getInventoryAlerts(organizationId: string) {
    const lowStockItems = await this.inventoryRepository.find({
      where: { availableQuantity: 5, isActive: true, organizationId }, // Less than or equal to 5
      take: 20,
    });

    const alerts = lowStockItems.map(item => ({
      id: item.id,
      name: item.name,
      currentQuantity: item.availableQuantity,
      minimumQuantity: 5,
      category: 'general',
      severity: item.availableQuantity === 0 ? ('critical' as const) : ('low' as const),
    }));

    return {
      success: true,
      data: alerts,
    };
  }

  async getPaymentAlerts(organizationId: string) {
    const overdueBookings = await this.bookingRepository.find({
      where: { paymentStatus: BookingPaymentStatus.OVERDUE, organizationId },
      relations: ['event'],
      take: 20,
    });

    const alerts = overdueBookings.map(booking => ({
      id: booking.id,
      customerName: booking.customerName,
      eventName: booking.event?.name || 'Unknown Event',
      amount: booking.balanceAmount,
      dueDate: booking.balanceDueDate.toISOString(),
      type: 'balance' as const,
      overdueDays: Math.floor(
        (Date.now() - booking.balanceDueDate.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    return {
      success: true,
      data: alerts,
    };
  }

  async getFinancialSummary(organizationId: string) {
    // For now, return mock data
    return {
      success: true,
      data: {
        thisMonth: {
          revenue: 25000,
          expenses: 15000,
          profit: 10000,
          bookings: 45,
        },
        lastMonth: {
          revenue: 22000,
          expenses: 14000,
          profit: 8000,
          bookings: 38,
        },
        growth: {
          revenue: 13.6,
          expenses: 7.1,
          profit: 25.0,
          bookings: 18.4,
        },
      },
    };
  }

  async getKPIs(organizationId: string) {
    return {
      success: true,
      data: {
        totalRevenue: { value: 125000, change: 12.5, trend: 'up' as const },
        totalBookings: { value: 234, change: 8.3, trend: 'up' as const },
        averageBookingValue: { value: 534, change: -2.1, trend: 'down' as const },
        customerSatisfaction: { value: 4.8, change: 0.2, trend: 'up' as const },
        inventoryTurnover: { value: 3.2, change: 0.5, trend: 'up' as const },
        profitMargin: { value: 23.5, change: 1.8, trend: 'up' as const },
      },
    };
  }
}
