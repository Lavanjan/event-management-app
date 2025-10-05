import { api } from './api';

export interface Payment {
  id: string;
  organizationId: string;
  bookingId: string;
  paymentType: 'payment' | 'refund' | 'partial_refund' | 'chargeback';
  paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'check' | 'paypal' | 'stripe' | 'square' | 'other';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
  amount: number;
  feeAmount?: number;
  netAmount: number;
  currency: string;
  transactionId?: string;
  gatewayTransactionId?: string;
  gatewayResponse?: any;
  description?: string;
  metadata?: any;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: string;
    customerName: string;
    eventTitle: string;
  };
}

export interface PaymentPlan {
  id: string;
  organizationId: string;
  bookingId: string;
  planType: 'installment' | 'subscription';
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installmentCount: number;
  paidInstallments: number;
  installmentAmount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextPaymentDate?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  paymentId: string;
  transactionType: 'payment_created' | 'payment_processed' | 'payment_failed' | 'refund_issued' | 'chargeback_received';
  amount: number;
  description: string;
  metadata?: any;
  createdAt: string;
}

export interface CreatePaymentRequest {
  bookingId: string;
  paymentType: Payment['paymentType'];
  paymentMethod: Payment['paymentMethod'];
  amount: number;
  description?: string;
  metadata?: any;
}

export interface RefundPaymentRequest {
  paymentId: string;
  amount: number;
  reason: string;
}

export interface PaymentFilters {
  status?: Payment['status'];
  paymentMethod?: Payment['paymentMethod'];
  paymentType?: Payment['paymentType'];
  bookingId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

class PaymentService {
  async getPayments(filters?: PaymentFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const response = await api.get(`/payments?${params.toString()}`);
    return response.data;
  }

  async getPayment(id: string): Promise<Payment> {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  }

  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    const response = await api.post('/payments', data);
    return response.data;
  }

  async refundPayment(data: RefundPaymentRequest): Promise<Payment> {
    const response = await api.post(`/payments/${data.paymentId}/refund`, {
      amount: data.amount,
      reason: data.reason,
    });
    return response.data;
  }

  async getPaymentTransactions(paymentId: string): Promise<PaymentTransaction[]> {
    const response = await api.get(`/payments/${paymentId}/transactions`);
    return response.data;
  }

  async getPaymentPlans(filters?: { status?: PaymentPlan['status']; bookingId?: string }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const response = await api.get(`/payment-plans?${params.toString()}`);
    return response.data;
  }

  async getPaymentPlan(id: string): Promise<PaymentPlan> {
    const response = await api.get(`/payment-plans/${id}`);
    return response.data;
  }

  async getBookingsWithOutstandingBalance() {
    const response = await api.get('/bookings?paymentStatus=pending,advance_paid');
    return response.data;
  }
}

export const paymentService = new PaymentService();
