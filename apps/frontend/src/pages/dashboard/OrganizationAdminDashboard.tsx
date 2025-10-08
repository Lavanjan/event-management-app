import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Package,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { useDashboardStats, useRecentBookings, useUpcomingEvents, useInventoryAlerts } from '../../hooks/useDashboard';
import { useCurrency } from '../../contexts/CurrencyContext';

export function OrganizationAdminDashboard() {
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();

  // Use real API data instead of mock data
  const { data: dashboardStats } = useDashboardStats();
  const { data: recentBookingsData } = useRecentBookings(5);
  const { data: upcomingEventsData } = useUpcomingEvents(5);
  const { data: inventoryAlertsData } = useInventoryAlerts();

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

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your event booking business today.
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Button variant="default" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="text-center pt-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-teal-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 truncate w-full">{formatAmount(orgStats.totalRevenue.value)}</p>
                <div className="flex items-center justify-center text-xs text-gray-500">
                  {orgStats.totalRevenue.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className="truncate">
                    {orgStats.totalRevenue.change > 0 ? '+' : ''}{orgStats.totalRevenue.change}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center pt-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 truncate w-full">{orgStats.totalBookings.value}</p>
                <div className="flex items-center justify-center text-xs text-gray-500">
                  {orgStats.totalBookings.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className="truncate">
                    {orgStats.totalBookings.change > 0 ? '+' : ''}{orgStats.totalBookings.change}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center pt-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600">Avg. Booking Value</p>
                <p className="text-2xl font-bold text-gray-900 truncate w-full">{formatAmount(orgStats.averageBookingValue.value)}</p>
                <div className="flex items-center justify-center text-xs text-gray-500">
                  {orgStats.averageBookingValue.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className="truncate">
                    {orgStats.averageBookingValue.change > 0 ? '+' : ''}{orgStats.averageBookingValue.change}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center pt-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-gray-900 truncate w-full">{orgStats.profitMargin.value.toFixed(1)}%</p>
                <div className="flex items-center justify-center text-xs text-gray-500">
                  {orgStats.profitMargin.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className="truncate">
                    {orgStats.profitMargin.change > 0 ? '+' : ''}{orgStats.profitMargin.change}%
                  </span>
                </div>
              </div>
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
