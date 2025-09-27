import api from './api';

export interface DashboardStats {
  overview: {
    totalInventoryItems: number;
    totalInventoryValue: number;
    activeEvents: number;
    totalBookings: number;
    totalRevenue: number;
    totalProfit: number;
    lowStockItems: number;
    overduePayments: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'booking_created' | 'payment_received' | 'inventory_updated' | 'event_created';
    title: string;
    description: string;
    timestamp: string;
    user?: string;
    amount?: number;
  }>;
  upcomingEvents: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    location: string;
    bookingsCount: number;
    status: string;
  }>;
  recentBookings: Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    eventName: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }>;
  financialSummary: {
    thisMonth: {
      revenue: number;
      expenses: number;
      profit: number;
      bookings: number;
    };
    lastMonth: {
      revenue: number;
      expenses: number;
      profit: number;
      bookings: number;
    };
    growth: {
      revenue: number;
      expenses: number;
      profit: number;
      bookings: number;
    };
  };
  inventoryAlerts: Array<{
    id: string;
    name: string;
    currentQuantity: number;
    minimumQuantity: number;
    category: string;
    severity: 'low' | 'critical';
  }>;
  paymentAlerts: Array<{
    id: string;
    customerName: string;
    eventName: string;
    amount: number;
    dueDate: string;
    type: 'advance' | 'balance';
    overdueDays: number;
  }>;
}

export interface ChartData {
  revenue: Array<{
    date: string;
    amount: number;
    bookings: number;
  }>;
  bookingsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  inventoryByCategory: Array<{
    category: string;
    count: number;
    value: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    bookings: number;
  }>;
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/dashboard/stats');
    return response.data.data;
  }

  async getChartData(period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<ChartData> {
    const response = await api.get(`/dashboard/charts?period=${period}`);
    return response.data.data;
  }

  async getRecentActivity(limit: number = 10): Promise<DashboardStats['recentActivity']> {
    const response = await api.get(`/dashboard/recent-activity?limit=${limit}`);
    return response.data.data;
  }

  async getUpcomingEvents(limit: number = 5): Promise<DashboardStats['upcomingEvents']> {
    const response = await api.get(`/dashboard/upcoming-events?limit=${limit}`);
    return response.data.data;
  }

  async getRecentBookings(limit: number = 10): Promise<DashboardStats['recentBookings']> {
    const response = await api.get(`/dashboard/recent-bookings?limit=${limit}`);
    return response.data.data;
  }

  async getInventoryAlerts(): Promise<DashboardStats['inventoryAlerts']> {
    const response = await api.get('/dashboard/inventory-alerts');
    return response.data.data;
  }

  async getPaymentAlerts(): Promise<DashboardStats['paymentAlerts']> {
    const response = await api.get('/dashboard/payment-alerts');
    return response.data.data;
  }

  async getFinancialSummary(): Promise<DashboardStats['financialSummary']> {
    const response = await api.get('/dashboard/financial-summary');
    return response.data.data;
  }

  async exportReport(
    type: 'overview' | 'financial' | 'inventory' | 'bookings',
    period: '7d' | '30d' | '90d' | '1y' = '30d',
    format: 'pdf' | 'xlsx' = 'pdf'
  ): Promise<Blob> {
    const response = await api.get(`/dashboard/export/${type}?period=${period}&format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getKPIs(): Promise<{
    totalRevenue: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
    totalBookings: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
    averageBookingValue: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
    customerSatisfaction: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
    inventoryTurnover: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
    profitMargin: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
  }> {
    const response = await api.get('/dashboard/kpis');
    return response.data.data;
  }
}

export const dashboardService = new DashboardService();
