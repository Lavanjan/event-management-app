import api from './api';
import {
  Booking,
  PaginatedResponse,
  CreateBookingDto,
  UpdateBookingDto,
  BookingStatus,
  PaymentStatus,
  AddExpenseDto,
  AddRevenueDto
} from '../types';

export interface BookingFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  eventId?: string;
  startDate?: string;
  endDate?: string;
}

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  averageBookingValue: number;
  paymentStats: {
    pending: number;
    advancePaid: number;
    fullyPaid: number;
    overdue: number;
  };
}

class BookingService {
  async getAll(filters: BookingFilters = {}): Promise<PaginatedResponse<Booking>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/bookings?${params.toString()}`);
    // API returns {success: true, data: {data: [...], total: 1, ...}}
    // We need to return the pagination object with items renamed to data
    const paginationData = response.data.data;
    return {
      ...paginationData,
      data: paginationData.data // items array
    };
  }

  async getById(id: string): Promise<Booking> {
    const response = await api.get(`/bookings/${id}`);
    return response.data.data;
  }

  async create(data: CreateBookingDto): Promise<Booking> {
    const response = await api.post('/bookings', data);
    return response.data.data;
  }

  async update(id: string, data: UpdateBookingDto): Promise<Booking> {
    const response = await api.patch(`/bookings/${id}`, data);
    return response.data.data;
  }

  async confirm(id: string): Promise<Booking> {
    const response = await api.patch(`/bookings/${id}/confirm`);
    return response.data.data;
  }

  async complete(id: string): Promise<Booking> {
    const response = await api.patch(`/bookings/${id}/complete`);
    return response.data.data;
  }

  async cancel(id: string, reason?: string): Promise<Booking> {
    const response = await api.patch(`/bookings/${id}/cancel`, { reason });
    return response.data.data;
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Booking> {
    const response = await api.patch(`/bookings/${id}/payment-status`, { paymentStatus });
    return response.data.data;
  }

  async getByEvent(eventId: string, filters: BookingFilters = {}): Promise<PaginatedResponse<Booking>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/bookings/event/${eventId}?${params.toString()}`);
    return response.data.data;
  }

  async getOverdue(): Promise<Booking[]> {
    const response = await api.get('/bookings/overdue');
    return response.data.data;
  }

  async addExpense(id: string, expense: AddExpenseDto): Promise<Booking> {
    const response = await api.post(`/bookings/${id}/expenses`, expense);
    return response.data.data;
  }

  async removeExpense(bookingId: string, expenseId: string): Promise<void> {
    await api.delete(`/bookings/${bookingId}/expenses/${expenseId}`);
  }

  async addRevenue(id: string, revenue: AddRevenueDto): Promise<Booking> {
    const response = await api.post(`/bookings/${id}/revenues`, revenue);
    return response.data.data;
  }

  async removeRevenue(bookingId: string, revenueId: string): Promise<void> {
    await api.delete(`/bookings/${bookingId}/revenues/${revenueId}`);
  }

  async getStats(): Promise<BookingStats> {
    const response = await api.get('/bookings/stats');
    return response.data.data;
  }

  async generateInvoice(id: string): Promise<Blob> {
    const response = await api.get(`/bookings/${id}/invoice`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async sendInvoice(id: string, email?: string): Promise<void> {
    await api.post(`/bookings/${id}/send-invoice`, { email });
  }

  async exportData(filters: BookingFilters = {}, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    params.append('format', format);

    const response = await api.get(`/bookings/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getPaymentHistory(id: string): Promise<Array<{
    id: string;
    amount: number;
    type: 'advance' | 'balance' | 'refund';
    status: 'pending' | 'completed' | 'failed';
    date: string;
    method?: string;
    reference?: string;
  }>> {
    const response = await api.get(`/bookings/${id}/payment-history`);
    return response.data.data;
  }

  async processPayment(id: string, data: {
    amount: number;
    type: 'advance' | 'balance';
    method: string;
    reference?: string;
  }): Promise<Booking> {
    const response = await api.post(`/bookings/${id}/process-payment`, data);
    return response.data.data;
  }
}

export const bookingService = new BookingService();
