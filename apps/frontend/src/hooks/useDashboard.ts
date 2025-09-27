import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const DASHBOARD_QUERY_KEYS = {
  all: ['dashboard'] as const,
  stats: () => [...DASHBOARD_QUERY_KEYS.all, 'stats'] as const,
  charts: (period: string) => [...DASHBOARD_QUERY_KEYS.all, 'charts', period] as const,
  recentActivity: (limit: number) => [...DASHBOARD_QUERY_KEYS.all, 'recent-activity', limit] as const,
  upcomingEvents: (limit: number) => [...DASHBOARD_QUERY_KEYS.all, 'upcoming-events', limit] as const,
  recentBookings: (limit: number) => [...DASHBOARD_QUERY_KEYS.all, 'recent-bookings', limit] as const,
  inventoryAlerts: () => [...DASHBOARD_QUERY_KEYS.all, 'inventory-alerts'] as const,
  paymentAlerts: () => [...DASHBOARD_QUERY_KEYS.all, 'payment-alerts'] as const,
  financialSummary: () => [...DASHBOARD_QUERY_KEYS.all, 'financial-summary'] as const,
  kpis: () => [...DASHBOARD_QUERY_KEYS.all, 'kpis'] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.stats(),
    queryFn: () => dashboardService.getStats(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useDashboardCharts(period: '7d' | '30d' | '90d' | '1y' = '30d') {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.charts(period),
    queryFn: () => dashboardService.getChartData(period),
    keepPreviousData: true,
  });
}

export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.recentActivity(limit),
    queryFn: () => dashboardService.getRecentActivity(limit),
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

export function useUpcomingEvents(limit: number = 5) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.upcomingEvents(limit),
    queryFn: () => dashboardService.getUpcomingEvents(limit),
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}

export function useRecentBookings(limit: number = 10) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.recentBookings(limit),
    queryFn: () => dashboardService.getRecentBookings(limit),
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

export function useInventoryAlerts() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.inventoryAlerts(),
    queryFn: () => dashboardService.getInventoryAlerts(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function usePaymentAlerts() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.paymentAlerts(),
    queryFn: () => dashboardService.getPaymentAlerts(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useFinancialSummary() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.financialSummary(),
    queryFn: () => dashboardService.getFinancialSummary(),
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}

export function useKPIs() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.kpis(),
    queryFn: () => dashboardService.getKPIs(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}
