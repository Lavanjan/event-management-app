import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService, PaymentFilters, CreatePaymentRequest, RefundPaymentRequest } from '../services/paymentService';
import { useToast } from './use-toast';

export function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: () => paymentService.getPayments(filters),
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentService.getPayment(id),
    enabled: !!id,
  });
}

export function usePaymentTransactions(paymentId: string) {
  return useQuery({
    queryKey: ['payment-transactions', paymentId],
    queryFn: () => paymentService.getPaymentTransactions(paymentId),
    enabled: !!paymentId,
  });
}

export function usePaymentPlans(filters?: { status?: string; bookingId?: string }) {
  return useQuery({
    queryKey: ['payment-plans', filters],
    queryFn: () => paymentService.getPaymentPlans(filters as any),
  });
}

export function useBookingsWithOutstandingBalance() {
  return useQuery({
    queryKey: ['bookings-outstanding-balance'],
    queryFn: () => paymentService.getBookingsWithOutstandingBalance(),
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreatePaymentRequest) => paymentService.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-outstanding-balance'] });
      toast({
        title: 'Success',
        description: 'Payment created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create payment',
        variant: 'destructive',
      });
    },
  });
}

export function useRefundPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: RefundPaymentRequest) => paymentService.refundPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: 'Success',
        description: 'Refund processed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to process refund',
        variant: 'destructive',
      });
    },
  });
}
