import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { bookingService, BookingFilters } from '../services/bookingService';
import { addNotification } from '../store/slices/uiSlice';
import {
  CreateBookingDto,
  UpdateBookingDto,
  PaymentStatus
} from '../types';

export const BOOKING_QUERY_KEYS = {
  all: ['bookings'] as const,
  lists: () => [...BOOKING_QUERY_KEYS.all, 'list'] as const,
  list: (filters: BookingFilters) => [...BOOKING_QUERY_KEYS.lists(), filters] as const,
  details: () => [...BOOKING_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...BOOKING_QUERY_KEYS.details(), id] as const,
  byEvent: (eventId: string, filters: BookingFilters) => 
    [...BOOKING_QUERY_KEYS.all, 'by-event', eventId, filters] as const,
  overdue: () => [...BOOKING_QUERY_KEYS.all, 'overdue'] as const,
  stats: () => [...BOOKING_QUERY_KEYS.all, 'stats'] as const,
  paymentHistory: (id: string) => [...BOOKING_QUERY_KEYS.all, 'payment-history', id] as const,
};

export function useBookingList(filters: BookingFilters = {}) {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.list(filters),
    queryFn: () => bookingService.getAll(filters),
    keepPreviousData: true,
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.detail(id),
    queryFn: () => bookingService.getById(id),
    enabled: !!id,
  });
}

export function useBookingsByEvent(eventId: string, filters: BookingFilters = {}) {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.byEvent(eventId, filters),
    queryFn: () => bookingService.getByEvent(eventId, filters),
    enabled: !!eventId,
    keepPreviousData: true,
  });
}

export function useOverdueBookings() {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.overdue(),
    queryFn: () => bookingService.getOverdue(),
  });
}

export function useBookingStats() {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.stats(),
    queryFn: () => bookingService.getStats(),
  });
}

export function usePaymentHistory(id: string) {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.paymentHistory(id),
    queryFn: () => bookingService.getPaymentHistory(id),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (data: CreateBookingDto) => bookingService.create(data),
    onSuccess: (newBooking) => {
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.stats() });
      // Invalidate inventory queries as quantities may have changed
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Booking Created',
        message: `Booking for ${newBooking.customerName} has been created`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Booking Creation Failed',
        message: error.response?.data?.message || 'Failed to create booking',
      }));
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookingDto }) =>
      bookingService.update(id, data),
    onSuccess: (updatedBooking) => {
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.detail(updatedBooking.id) });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.stats() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Booking Updated',
        message: `Booking for ${updatedBooking.customerName} has been updated`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.response?.data?.message || 'Failed to update booking',
      }));
    },
  });
}

export function useConfirmBooking() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (id: string) => bookingService.confirm(id),
    onSuccess: (confirmedBooking) => {
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.detail(confirmedBooking.id) });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.stats() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Booking Confirmed',
        message: `Booking for ${confirmedBooking.customerName} has been confirmed`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Confirmation Failed',
        message: error.response?.data?.message || 'Failed to confirm booking',
      }));
    },
  });
}

export function useStartBooking() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (id: string) => bookingService.start(id),
    onSuccess: (startedBooking) => {
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.detail(startedBooking.id) });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.stats() });

      dispatch(addNotification({
        type: 'success',
        title: 'Event Started',
        message: `Event for ${startedBooking.customerName} has been started`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Start Failed',
        message: error.response?.data?.message || 'Failed to start event',
      }));
    },
  });
}

export function useCompleteBooking() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (id: string) => bookingService.complete(id),
    onSuccess: (completedBooking) => {
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.detail(completedBooking.id) });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.stats() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Booking Completed',
        message: `Booking for ${completedBooking.customerName} has been completed`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Completion Failed',
        message: error.response?.data?.message || 'Failed to complete booking',
      }));
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      bookingService.cancel(id, reason),
    onSuccess: (cancelledBooking) => {
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.detail(cancelledBooking.id) });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.stats() });
      // Invalidate inventory queries as quantities may have been deallocated
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Booking Cancelled',
        message: `Booking for ${cancelledBooking.customerName} has been cancelled`,
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Cancellation Failed',
        message: error.response?.data?.message || 'Failed to cancel booking',
      }));
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: PaymentStatus }) =>
      bookingService.updatePaymentStatus(id, paymentStatus),
    onSuccess: (updatedBooking) => {
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.detail(updatedBooking.id) });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.stats() });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.overdue() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Payment Status Updated',
        message: 'Payment status has been updated successfully',
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

export function useAddExpense() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ id, expense }: { id: string; expense: any }) =>
      bookingService.addExpense(id, expense),
    onSuccess: (updatedBooking) => {
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.detail(updatedBooking.id) });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.stats() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Expense Added',
        message: 'Expense has been added to the booking',
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to Add Expense',
        message: error.response?.data?.message || 'Failed to add expense',
      }));
    },
  });
}

export function useAddRevenue() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ id, revenue }: { id: string; revenue: any }) =>
      bookingService.addRevenue(id, revenue),
    onSuccess: (updatedBooking) => {
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.detail(updatedBooking.id) });
      queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.stats() });
      
      dispatch(addNotification({
        type: 'success',
        title: 'Revenue Added',
        message: 'Revenue has been added to the booking',
      }));
    },
    onError: (error: any) => {
      dispatch(addNotification({
        type: 'error',
        title: 'Failed to Add Revenue',
        message: error.response?.data?.message || 'Failed to add revenue',
      }));
    },
  });
}
