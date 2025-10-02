import { api } from './api';
import { Booking, PaymentStatus } from '../types';

export interface PaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  type: 'advance' | 'balance' | 'refund';
  status: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
  transactionId?: string;
  reference?: string;
  notes?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
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
  averagePaymentTime: number; // in days
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  search?: string;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaymentReminder {
  bookingId: string;
  customerEmail: string;
  customerName: string;
  eventName: string;
  amount: number;
  dueDate: string;
  type: 'advance' | 'balance';
  template?: 'gentle' | 'urgent' | 'final';
}

export interface CreatePaymentRecordDto {
  bookingId: string;
  amount: number;
  type: 'advance' | 'balance' | 'refund';
  paymentMethod?: string;
  transactionId?: string;
  reference?: string;
  notes?: string;
}

class PaymentService {
  // Get payment summary/statistics
  async getPaymentSummary(filters?: PaymentFilters): Promise<PaymentSummary> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/payments/summary?${params.toString()}`);
    return response.data.data;
  }

  // Get payment records for a specific booking
  async getPaymentHistory(bookingId: string): Promise<PaymentRecord[]> {
    const response = await api.get(`/payments/booking/${bookingId}/history`);
    return response.data.data;
  }

  // Record a new payment
  async recordPayment(paymentData: CreatePaymentRecordDto): Promise<PaymentRecord> {
    const response = await api.post('/payments/record', paymentData);
    return response.data.data;
  }

  // Update payment status for a booking
  async updatePaymentStatus(bookingId: string, status: PaymentStatus): Promise<Booking> {
    const response = await api.patch(`/bookings/${bookingId}/payment-status`, {
      paymentStatus: status,
    });
    return response.data.data;
  }

  // Get overdue payments
  async getOverduePayments(): Promise<Booking[]> {
    const response = await api.get('/payments/overdue');
    return response.data.data;
  }

  // Send payment reminder
  async sendPaymentReminder(reminder: PaymentReminder): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/payments/send-reminder', reminder);
    return response.data;
  }

  // Send bulk payment reminders
  async sendBulkReminders(bookingIds: string[], template?: string): Promise<{ 
    success: boolean; 
    sent: number; 
    failed: number; 
    details: Array<{ bookingId: string; success: boolean; error?: string }>;
  }> {
    const response = await api.post('/payments/send-bulk-reminders', {
      bookingIds,
      template,
    });
    return response.data;
  }

  // Generate payment report
  async generatePaymentReport(filters?: PaymentFilters, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    params.append('format', format);

    const response = await api.get(`/payments/report?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Get payment analytics
  async getPaymentAnalytics(dateRange?: { from: string; to: string }): Promise<{
    paymentTrends: Array<{ date: string; amount: number; count: number }>;
    paymentMethodBreakdown: Array<{ method: string; amount: number; percentage: number }>;
    averagePaymentTime: number;
    paymentStatusDistribution: Array<{ status: PaymentStatus; count: number; percentage: number }>;
    monthlyRecurring: number;
    seasonalTrends: Array<{ month: string; amount: number }>;
  }> {
    const params = new URLSearchParams();
    
    if (dateRange?.from) params.append('from', dateRange.from);
    if (dateRange?.to) params.append('to', dateRange.to);

    const response = await api.get(`/payments/analytics?${params.toString()}`);
    return response.data.data;
  }

  // Process refund
  async processRefund(bookingId: string, amount: number, reason?: string): Promise<{
    success: boolean;
    refundId: string;
    amount: number;
    processedAt: string;
  }> {
    const response = await api.post(`/payments/refund`, {
      bookingId,
      amount,
      reason,
    });
    return response.data;
  }

  // Get payment methods
  async getPaymentMethods(): Promise<Array<{
    id: string;
    name: string;
    type: 'card' | 'bank_transfer' | 'cash' | 'check' | 'other';
    isActive: boolean;
    processingFee?: number;
  }>> {
    const response = await api.get('/payments/methods');
    return response.data.data;
  }

  // Validate payment
  async validatePayment(transactionId: string, amount: number): Promise<{
    isValid: boolean;
    status: 'pending' | 'completed' | 'failed';
    verifiedAmount: number;
    fees?: number;
    netAmount?: number;
  }> {
    const response = await api.post('/payments/validate', {
      transactionId,
      amount,
    });
    return response.data;
  }

  // Get payment calendar (due dates)
  async getPaymentCalendar(month: string, year: string): Promise<Array<{
    date: string;
    payments: Array<{
      bookingId: string;
      customerName: string;
      eventName: string;
      amount: number;
      type: 'advance' | 'balance';
      status: PaymentStatus;
    }>;
    totalAmount: number;
    count: number;
  }>> {
    const response = await api.get(`/payments/calendar?month=${month}&year=${year}`);
    return response.data.data;
  }

  // Export payment data
  async exportPayments(filters?: PaymentFilters, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    params.append('format', format);

    const response = await api.get(`/payments/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Bulk update payment status
  async bulkUpdatePaymentStatus(bookingIds: string[], status: PaymentStatus): Promise<{
    success: boolean;
    updated: number;
    failed: number;
    details: Array<{ bookingId: string; success: boolean; error?: string }>;
  }> {
    const response = await api.patch('/payments/bulk-update-status', {
      bookingIds,
      status,
    });
    return response.data;
  }
}

export const paymentService = new PaymentService();
