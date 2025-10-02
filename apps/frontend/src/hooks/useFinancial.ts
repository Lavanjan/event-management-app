import { useQuery } from '@tanstack/react-query';
import { financialService, DateRange } from '../services/financialService';

// Query Keys
export const FINANCIAL_QUERY_KEYS = {
  all: ['financial'] as const,
  summary: (dateRange?: DateRange) => [...FINANCIAL_QUERY_KEYS.all, 'summary', dateRange] as const,
  revenue: (dateRange?: DateRange) => [...FINANCIAL_QUERY_KEYS.all, 'revenue', dateRange] as const,
  expenses: (dateRange?: DateRange) => [...FINANCIAL_QUERY_KEYS.all, 'expenses', dateRange] as const,
  profitLoss: (dateRange?: DateRange) => [...FINANCIAL_QUERY_KEYS.all, 'profit-loss', dateRange] as const,
};

// Hooks
export function useFinancialSummary(dateRange?: DateRange) {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.summary(dateRange),
    queryFn: () => financialService.getSummary(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}

export function useRevenueReport(dateRange?: DateRange) {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.revenue(dateRange),
    queryFn: () => financialService.getRevenueReport(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useExpenseReport(dateRange?: DateRange) {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.expenses(dateRange),
    queryFn: () => financialService.getExpenseReport(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProfitLossReport(dateRange?: DateRange) {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.profitLoss(dateRange),
    queryFn: () => financialService.getProfitLossReport(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Combined hook for comprehensive financial data
export function useFinancialReports(dateRange?: DateRange) {
  const summary = useFinancialSummary(dateRange);
  const revenue = useRevenueReport(dateRange);
  const expenses = useExpenseReport(dateRange);
  const profitLoss = useProfitLossReport(dateRange);

  return {
    summary,
    revenue,
    expenses,
    profitLoss,
    isLoading: summary.isLoading || revenue.isLoading || expenses.isLoading || profitLoss.isLoading,
    isError: summary.isError || revenue.isError || expenses.isError || profitLoss.isError,
    error: summary.error || revenue.error || expenses.error || profitLoss.error,
  };
}
