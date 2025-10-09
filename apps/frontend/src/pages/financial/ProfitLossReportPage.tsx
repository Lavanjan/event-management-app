import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  BarChart3,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  FileText,
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
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { PageLoading, ErrorState } from '../../components/forms/LoadingSpinner';
import { useFinancialReports } from '../../hooks/useFinancial';
import { useCurrency } from '../../contexts/CurrencyContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export function ProfitLossReportPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [period, setPeriod] = useState('month');

  const {
    data: financialData,
    isLoading,
    error,
  } = useFinancialReports(dateRange);

  const { formatAmount } = useCurrency();

  const handleExportReport = async (type: 'pdf' | 'excel') => {
    try {
      // In a real implementation, this would call the export API
      alert(`${type.toUpperCase()} export initiated for Profit & Loss Report`);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export ${type.toUpperCase()} report`);
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    const now = new Date();
    let from: Date, to: Date;

    switch (newPeriod) {
      case 'week':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        to = now;
        break;
      case 'month':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'quarter':
        from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        to = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        from = startOfMonth(now);
        to = endOfMonth(now);
    }

    setDateRange({
      from: format(from, 'yyyy-MM-dd'),
      to: format(to, 'yyyy-MM-dd'),
    });
  };

  if (isLoading) {
    return <PageLoading message="Loading profit & loss report..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load profit & loss report"
        message="There was an error loading the financial data. Please try again."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const totalRevenue = (financialData as any)?.totalRevenue || 0;
  const totalExpenses = (financialData as any)?.totalExpenses || 0;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const previousProfit = (financialData as any)?.previousProfit || 0;
  const profitGrowth = previousProfit !== 0 ? ((netProfit - previousProfit) / Math.abs(previousProfit)) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profit & Loss Report</h1>
          <p className="text-muted-foreground">
            Comprehensive financial performance analysis
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="from">From Date</Label>
              <Input
                id="from"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To Date</Label>
              <Input
                id="to"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* P&L Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Gross income
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatAmount(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatAmount(netProfit)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {profitGrowth >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={profitGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(profitGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Profit percentage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* P&L Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Profit & Loss Statement
          </CardTitle>
          <CardDescription>Detailed financial breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Revenue Section */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-3 text-green-700">Revenue</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Event Bookings</span>
                  <span className="font-medium">{formatAmount(totalRevenue * 0.8)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Additional Services</span>
                  <span className="font-medium">{formatAmount(totalRevenue * 0.15)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Income</span>
                  <span className="font-medium">{formatAmount(totalRevenue * 0.05)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total Revenue</span>
                  <span className="text-green-600">{formatAmount(totalRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-3 text-red-700">Expenses</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Inventory Costs</span>
                  <span className="font-medium">{formatAmount(totalExpenses * 0.4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Venue Expenses</span>
                  <span className="font-medium">{formatAmount(totalExpenses * 0.25)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Staff Costs</span>
                  <span className="font-medium">{formatAmount(totalExpenses * 0.2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marketing & Advertising</span>
                  <span className="font-medium">{formatAmount(totalExpenses * 0.1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Expenses</span>
                  <span className="font-medium">{formatAmount(totalExpenses * 0.05)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total Expenses</span>
                  <span className="text-red-600">{formatAmount(totalExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Net Profit Section */}
            <div>
              <div className="flex justify-between font-bold text-xl">
                <span>Net Profit</span>
                <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatAmount(netProfit)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>Profit Margin</span>
                <span>{profitMargin.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Revenue vs Expenses
            </CardTitle>
            <CardDescription>Monthly comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chart visualization will be implemented</p>
                <div className="text-sm space-y-1 mt-2">
                  <p>Revenue: {formatAmount(totalRevenue)}</p>
                  <p>Expenses: {formatAmount(totalExpenses)}</p>
                  <p>Profit: {formatAmount(netProfit)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Profit Trend
            </CardTitle>
            <CardDescription>Profit performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Profit trend chart will be implemented</p>
                <div className="text-sm space-y-1 mt-2">
                  <p>Current Margin: {profitMargin.toFixed(1)}%</p>
                  <p>Growth: {profitGrowth >= 0 ? '+' : ''}{profitGrowth.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
