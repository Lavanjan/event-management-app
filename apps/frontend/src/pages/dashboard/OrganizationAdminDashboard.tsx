import { useState } from 'react';
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
  Download,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { useDashboardStats, useRecentBookings, useInventoryAlerts } from '../../hooks/useDashboard';
import { useCurrency } from '../../contexts/CurrencyContext';
import { BookingDetailsModal } from '../../components/modals/BookingDetailsModal';

export function OrganizationAdminDashboard() {
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Use real API data instead of mock data
  const { data: dashboardStats } = useDashboardStats();
  const { data: recentBookingsData } = useRecentBookings(5);
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
  const inventoryAlerts = inventoryAlertsData || [];
  const paymentAlerts = dashboardStats?.paymentAlerts || [];

  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'default';
      case 'advance_paid': return 'secondary';
      case 'pending': return 'outline';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="text-center pt-3 pb-3">
            <div className="flex flex-col items-center space-y-2">
              <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-teal-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900 truncate w-full">{formatAmount(orgStats.totalRevenue.value)}</p>
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
          <CardContent className="text-center pt-3 pb-3">
            <div className="flex flex-col items-center space-y-2">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-gray-600">Total Bookings</p>
                <p className="text-xl font-bold text-gray-900 truncate w-full">{orgStats.totalBookings.value}</p>
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
          <CardContent className="text-center pt-3 pb-3">
            <div className="flex flex-col items-center space-y-2">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-gray-600">Avg. Booking Value</p>
                <p className="text-xl font-bold text-gray-900 truncate w-full">{formatAmount(orgStats.averageBookingValue.value)}</p>
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
          <CardContent className="text-center pt-3 pb-3">
            <div className="flex flex-col items-center space-y-2">
              <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-gray-600">Profit Margin</p>
                <p className="text-xl font-bold text-gray-900 truncate w-full">{orgStats.profitMargin.value.toFixed(1)}%</p>
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
                  onClick={() => handleBookingClick(booking)}
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
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Status:</span>
                        <Badge variant={getStatusColor(booking.status)} className="text-xs">
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Payment:</span>
                        <Badge variant={getPaymentStatusColor(booking.paymentStatus)} className="text-xs">
                          {booking.paymentStatus?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activities and updates</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
              View Reports
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.slice(0, 3).map((booking) => (
                <div
                  key={`activity-${booking.id}`}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">New booking created</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.customerName} booked {booking.eventName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(booking.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatAmount(booking.totalAmount)}</p>
                  </div>
                </div>
              ))}
              {recentBookings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedBooking(null);
          }}
        />
      )}
    </div>
  );
}
