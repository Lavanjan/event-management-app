import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { 
  paymentService, 
  PaymentFilters, 
  PaymentReminder, 
  CreatePaymentRecordDto 
} from '../services/paymentService';
import { addNotification } from '../store/slices/uiSlice';
import { PaymentStatus } from '../types';

export const PAYMENT_QUERY_KEYS = {
  all: ['payments'] as const,
  summary: (filters?: PaymentFilters) => [...PAYMENT_QUERY_KEYS.all, 'summary', filters] as const,
  history: (bookingId: string) => [...PAYMENT_QUERY_KEYS.all, 'history', bookingId] as const,
  overdue: () => [...PAYMENT_QUERY_KEYS.all, 'overdue'] as const,
  analytics: (dateRange?: { from: string; to: string }) => 
    [...PAYMENT_QUERY_KEYS.all, 'analytics', dateRange] as const,
  methods: () => [...PAYMENT_QUERY_KEYS.all, 'methods'] as const,
  calendar: (month: string, year: string) => 
    [...PAYMENT_QUERY_KEYS.all, 'calendar', month, year] as const,
};

// Get payment summary/statistics
export function usePaymentSummary(filters?: PaymentFilters) {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.summary(filters),
    queryFn: () => paymentService.getPaymentSummary(filters),
    keepPreviousData: true,
  });
}

// Get payment history for a specific booking
export function usePaymentHistory(bookingId: string) {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.history(bookingId),
    queryFn: () => paymentService.getPaymentHistory(bookingId),
    enabled: !!bookingId,
  });
}

// Get overdue payments
export function useOverduePayments() {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.overdue(),
    queryFn: () => paymentService.getOverduePayments(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Get payment analytics
export function usePaymentAnalytics(dateRange?: { from: string; to: string }) {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.analytics(dateRange),
    queryFn: () => paymentService.getPaymentAnalytics(dateRange),
    keepPreviousData: true,
  });
}

// Get payment methods
export function usePaymentMethods() {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.methods(),
    queryFn: () => paymentService.getPaymentMethods(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get payment calendar
export function usePaymentCalendar(month: string, year: string) {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.calendar(month, year),
    queryFn: () => paymentService.getPaymentCalendar(month, year),
    enabled: !!month && !!year,
  });
}

// Record a new payment
export function useRecordPayment() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (paymentData: CreatePaymentRecordDto) => 
      paymentService.recordPayment(paymentData),
    onSuccess: (newPayment) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Payment Recorded',
        message: `Payment of $${newPayment.amount} has been recorded successfully`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Payment Recording Failed',
        message: error.response?.data?.message || 'Failed to record payment',
      }));
    },
  });
}

// Update payment status
export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: PaymentStatus }) =>
      paymentService.updatePaymentStatus(bookingId, status),
    onSuccess: (updatedBooking) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Payment Status Updated',
        message: `Payment status for ${updatedBooking.customerName} has been updated`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.response?.data?.message || 'Failed to update payment status',
      }));
    },
  });
}

// Send payment reminder
export function useSendPaymentReminder() {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (reminder: PaymentReminder) => 
      paymentService.sendPaymentReminder(reminder),
    onSuccess: (result) => {
      dispatch(addNotification({
        type: 'success',
        title: 'Reminder Sent',
        message: result.message || 'Payment reminder has been sent successfully',
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Reminder Failed',
        message: error.response?.data?.message || 'Failed to send payment reminder',
      }));
    },
  });
}

// Send bulk payment reminders
export function useSendBulkReminders() {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ bookingIds, template }: { bookingIds: string[]; template?: string }) =>
      paymentService.sendBulkReminders(bookingIds, template),
    onSuccess: (result) => {
      dispatch(addNotification({
        type: 'success',
        title: 'Bulk Reminders Sent',
        message: `${result.sent} reminders sent successfully. ${result.failed} failed.`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Bulk Reminders Failed',
        message: error.response?.data?.message || 'Failed to send bulk reminders',
      }));
    },
  });
}

// Process refund
export function useProcessRefund() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ bookingId, amount, reason }: { 
      bookingId: string; 
      amount: number; 
      reason?: string;
    }) => paymentService.processRefund(bookingId, amount, reason),
    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Refund Processed',
        message: `Refund of $${result.amount} has been processed successfully`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Refund Failed',
        message: error.response?.data?.message || 'Failed to process refund',
      }));
    },
  });
}

// Validate payment
export function useValidatePayment() {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ transactionId, amount }: { transactionId: string; amount: number }) =>
      paymentService.validatePayment(transactionId, amount),
    onSuccess: (result) => {
      if (result.isValid) {
        dispatch(addNotification({
          type: 'success',
          title: 'Payment Validated',
          message: `Payment of $${result.verifiedAmount} has been validated`,
        }));
      } else {
        dispatch(addNotification({
          type: 'warning',
          title: 'Payment Validation Failed',
          message: 'Payment could not be validated. Please check the transaction details.',
        }));
      }
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Validation Error',
        message: error.response?.data?.message || 'Failed to validate payment',
      }));
    },
  });
}

// Bulk update payment status
export function useBulkUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ bookingIds, status }: { bookingIds: string[]; status: PaymentStatus }) =>
      paymentService.bulkUpdatePaymentStatus(bookingIds, status),
    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Bulk Update Complete',
        message: `${result.updated} payments updated successfully. ${result.failed} failed.`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Bulk Update Failed',
        message: error.response?.data?.message || 'Failed to update payment statuses',
      }));
    },
  });
}

// Export payments
export function useExportPayments() {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ filters, format }: { 
      filters?: PaymentFilters; 
      format?: 'csv' | 'xlsx';
    }) => paymentService.exportPayments(filters, format),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payments-export.${variables.format || 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      dispatch(addNotification({
        type: 'success',
        title: 'Export Complete',
        message: 'Payment data has been exported successfully',
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Export Failed',
        message: error.response?.data?.message || 'Failed to export payment data',
      }));
    },
  });
}
