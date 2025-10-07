import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Package,
  Calendar,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Clock,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useDashboardStats, useRecentBookings, useUpcomingEvents, useInventoryAlerts } from '../../hooks/useDashboard';
import { useCurrency } from '../../contexts/CurrencyContext';
import CreateBookingDialog from '../../components/modals/CreateBookingDialog';

export function OrganizationAdminDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();

  // Use real API data instead of mock data
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentBookingsData, isLoading: bookingsLoading } = useRecentBookings(5);
  const { data: upcomingEventsData, isLoading: eventsLoading } = useUpcomingEvents(5);
  const { data: inventoryAlertsData, isLoading: alertsLoading } = useInventoryAlerts();

  // Extract real data or provide default values
  const orgStats = {
    totalRevenue: {
      value: dashboardStats?.overview?.totalRevenue || 0,
      change: dashboardStats?.overview?.revenueGrowth || 0,
      trend: (dashboardStats?.overview?.revenueGrowth || 0) >= 0 ? 'up' as const : 'down' as const
    },
    totalBookings: {
      value: dashboardStats?.overview?.totalBookings || 0,
      change: dashboardStats?.overview?.bookingsGrowth || 0,
      trend: (dashboardStats?.overview?.bookingsGrowth || 0) >= 0 ? 'up' as const : 'down' as const
    },
    averageBookingValue: {
      value: dashboardStats?.overview?.averageBookingValue || 0,
      change: dashboardStats?.overview?.avgBookingGrowth || 0,
      trend: (dashboardStats?.overview?.avgBookingGrowth || 0) >= 0 ? 'up' as const : 'down' as const
    },
    profitMargin: {
      value: dashboardStats?.overview?.profitMargin || 0,
      change: dashboardStats?.overview?.profitMarginChange || 0,
      trend: (dashboardStats?.overview?.profitMarginChange || 0) >= 0 ? 'up' as const : 'down' as const
    }
  };

  const recentBookings = recentBookingsData || [];
  const upcomingEvents = upcomingEventsData || [];
  const inventoryAlerts = inventoryAlertsData || [];
  const paymentAlerts = dashboardStats?.paymentAlerts || [];



  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
      case 'active':
        return 'success';
      case 'pending':
      case 'draft':
        return 'warning';
      case 'cancelled':
      case 'overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your event booking business today.
          </p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <CreateBookingDialog onBookingCreated={() => {
            // Refresh dashboard data when booking is created
            window.location.reload();
          }} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(orgStats.totalRevenue.value)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(orgStats.totalRevenue.trend)}
              <span className="ml-1">
                {orgStats.totalRevenue.change > 0 ? '+' : ''}{orgStats.totalRevenue.change}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(orgStats.totalBookings.value)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(orgStats.totalBookings.trend)}
              <span className="ml-1">
                {orgStats.totalBookings.change > 0 ? '+' : ''}{orgStats.totalBookings.change}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Booking Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(orgStats.averageBookingValue.value)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(orgStats.averageBookingValue.trend)}
              <span className="ml-1">
                {orgStats.averageBookingValue.change > 0 ? '+' : ''}{orgStats.averageBookingValue.change}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgStats.profitMargin.value.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(orgStats.profitMargin.trend)}
              <span className="ml-1">
                {orgStats.profitMargin.change > 0 ? '+' : ''}{orgStats.profitMargin.change}% from last month
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(inventoryAlerts.length > 0 || paymentAlerts.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Inventory Alerts */}
          {inventoryAlerts.length > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-800 dark:text-orange-200">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Inventory Alerts
                </CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventoryAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{alert.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.currentQuantity} remaining (min: {alert.minimumQuantity})
                        </p>
                      </div>
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'warning'}>
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/inventory')}
                    className="w-full mt-2"
                  >
                    View Inventory
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Alerts */}
          {paymentAlerts.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardHeader>
                <CardTitle className="flex items-center text-red-800 dark:text-red-200">
                  <Clock className="mr-2 h-5 w-5" />
                  Payment Alerts
                </CardTitle>
                <CardDescription>Overdue payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{alert.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.eventName} • {alert.overdueDays} days overdue
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatAmount(alert.amount)}</p>
                        <Badge variant="destructive">{alert.type}</Badge>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/bookings?filter=overdue')}
                    className="w-full mt-2"
                  >
                    View All Overdue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest bookings from your customers</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/bookings')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{booking.customerName}</p>
                    <p className="text-xs text-muted-foreground">{booking.eventName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium">{formatAmount(booking.totalAmount)}</p>
                    <Badge variant={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events scheduled for the coming days</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/events')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{event.name}</p>
                    <p className="text-xs text-muted-foreground">{event.location}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.startDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium">{event.bookingsCount} bookings</p>
                    <Badge variant={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
