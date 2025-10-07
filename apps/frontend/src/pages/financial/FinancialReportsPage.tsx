import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  FileText,
  CreditCard,
  Activity,
  Target,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { PageLoading, ErrorState } from '../../components/forms/LoadingSpinner';
import { financialService } from '../../services/financialService';
import { useFinancialReports } from '../../hooks/useFinancial';
import { useCurrency } from '../../contexts/CurrencyContext';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export function FinancialReportsPage() {
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const {
    summary,
    revenue,
    expenses,
    profitLoss,
    isLoading,
    isError,
    error,
  } = useFinancialReports(dateRange);

  const { formatAmount } = useCurrency();

  const handleExportReport = async (type: 'pdf' | 'excel') => {
    try {
      const response = await financialService.exportReport(type, dateRange);

      // For now, show a success message
      // In a real implementation, this would trigger a file download
      alert(`${type.toUpperCase()} export initiated for ${dateRange.from} to ${dateRange.to}`);
      console.log('Export response:', response);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export ${type.toUpperCase()} report`);
    }
  };

  if (isLoading) {
    return <PageLoading message="Loading financial reports..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load financial reports"
        message="There was an error loading the financial data."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const summaryData = summary.data?.data || {};
  const revenueData = revenue.data?.data || {};
  const expenseData = expenses.data?.data || {};
  const profitLossData = profitLoss.data?.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Reports</h1>
          <p className="text-muted-foreground">
            Track revenue, expenses, and financial performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => handleExportReport('excel')}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExportReport('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Date Range:</span>
            </div>
            <Input
              type="date"
              value={dateRange.from}
              onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-auto"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateRange.to}
              onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-auto"
            />
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(summaryData.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <Activity className="inline h-3 w-3 mr-1" />
              {revenueData.bookingCount || 0} revenue transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatAmount(summaryData.totalExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <Activity className="inline h-3 w-3 mr-1" />
              {expenseData.bookingCount || 0} expense transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatAmount(summaryData.netProfit || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <Target className="inline h-3 w-3 mr-1" />
              {formatAmount(profitLossData.averageProfit || 0)} avg per booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.profitMargin?.toFixed(1) || '0'}%</div>
            <p className="text-xs text-muted-foreground">
              <Activity className="inline h-3 w-3 mr-1" />
              {summaryData.totalBookings || 0} total bookings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Revenue vs Expenses
            </CardTitle>
            <CardDescription>Monthly comparison for the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chart visualization will be implemented</p>
                <p className="text-sm">Revenue: {formatAmount(summaryData.totalRevenue || 0)}</p>
                <p className="text-sm">
                  Expenses: {formatAmount(summaryData.totalExpenses || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Monthly breakdown: {profitLossData.monthlyProfitLoss?.length || 0} months
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Expense Breakdown
            </CardTitle>
            <CardDescription>Expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summaryData.expensesByCategory?.map((category: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatAmount(category.amount || 0)}</div>
                    <div className="text-xs text-muted-foreground">{category.percentage?.toFixed(1)}%</div>
                  </div>
                </div>
              )) || (
                <div className="text-center text-muted-foreground py-8">
                  <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No expense data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Latest financial transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summaryData.recentTransactions?.map((transaction: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      transaction.type === 'revenue' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-medium ${
                      transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'revenue' ? '+' : '-'}{formatAmount(transaction.amount || 0).replace(/^Rs\./, '')}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {transaction.category}
                  </Badge>
                </div>
              </div>
            )) || (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent transactions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Profit & Loss Breakdown */}
      {profitLossData.monthlyProfitLoss && profitLossData.monthlyProfitLoss.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Monthly Profit & Loss
            </CardTitle>
            <CardDescription>Monthly breakdown of revenue, expenses, and profit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profitLossData.monthlyProfitLoss.map((month: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{month.label}</h4>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <span className="text-green-600">
                        Revenue: {formatAmount(month.revenue || 0)}
                      </span>
                      <span className="text-red-600">
                        Expenses: {formatAmount(month.expenses || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      month.profit >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {month.profit >= 0 ? '+' : ''}{formatAmount(month.profit || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {month.profitMargin?.toFixed(1) || '0'}% margin
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
