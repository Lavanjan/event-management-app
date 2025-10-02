import { api } from './api';

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
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
}

export interface DateRange {
  from: string;
  to: string;
}

export const financialService = {
  async getSummary(dateRange?: DateRange): Promise<{ success: boolean; data: FinancialSummary }> {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('from', dateRange.from);
    if (dateRange?.to) params.append('to', dateRange.to);
    
    const response = await api.get(`/financial/summary?${params.toString()}`);
    return response.data;
  },

  async getRevenueReport(dateRange?: DateRange): Promise<{ success: boolean; data: any }> {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('from', dateRange.from);
    if (dateRange?.to) params.append('to', dateRange.to);
    
    const response = await api.get(`/financial/revenue?${params.toString()}`);
    return response.data;
  },

  async getExpenseReport(dateRange?: DateRange): Promise<{ success: boolean; data: any }> {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('from', dateRange.from);
    if (dateRange?.to) params.append('to', dateRange.to);

    const response = await api.get(`/financial/expenses?${params.toString()}`);
    return response.data;
  },

  async getProfitLossReport(dateRange?: DateRange): Promise<{ success: boolean; data: any }> {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('from', dateRange.from);
    if (dateRange?.to) params.append('to', dateRange.to);

    const response = await api.get(`/financial/profit-loss?${params.toString()}`);
    return response.data;
  },

  async exportReport(type: 'pdf' | 'excel', dateRange?: DateRange): Promise<Blob> {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('from', dateRange.from);
    if (dateRange?.to) params.append('to', dateRange.to);
    params.append('format', type);

    const response = await api.get(`/financial/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
