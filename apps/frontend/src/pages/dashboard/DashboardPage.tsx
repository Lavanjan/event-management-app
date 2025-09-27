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
import {
  useDashboardStats,
  useRecentActivity,
  useUpcomingEvents,
  useRecentBookings,
  useInventoryAlerts,
  usePaymentAlerts,
  useKPIs
} from '../../hooks/useDashboard';
import { format } from 'date-fns';

export function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: kpis, isLoading: kpisLoading } = useKPIs();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(5);
  const { data: upcomingEvents, isLoading: eventsLoading } = useUpcomingEvents(5);
  const { data: recentBookings, isLoading: bookingsLoading } = useRecentBookings(5);
  const { data: inventoryAlerts, isLoading: inventoryAlertsLoading } = useInventoryAlerts();
  const { data: paymentAlerts, isLoading: paymentAlertsLoading } = usePaymentAlerts();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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
          <Button onClick={() => navigate('/bookings/create')}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {!kpisLoading && kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpis.totalRevenue.value)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getTrendIcon(kpis.totalRevenue.trend)}
                <span className="ml-1">
                  {kpis.totalRevenue.change > 0 ? '+' : ''}{kpis.totalRevenue.change}% from last month
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
              <div className="text-2xl font-bold">{formatNumber(kpis.totalBookings.value)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getTrendIcon(kpis.totalBookings.trend)}
                <span className="ml-1">
                  {kpis.totalBookings.change > 0 ? '+' : ''}{kpis.totalBookings.change}% from last month
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
              <div className="text-2xl font-bold">{formatCurrency(kpis.averageBookingValue.value)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getTrendIcon(kpis.averageBookingValue.trend)}
                <span className="ml-1">
                  {kpis.averageBookingValue.change > 0 ? '+' : ''}{kpis.averageBookingValue.change}% from last month
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
              <div className="text-2xl font-bold">{kpis.profitMargin.value.toFixed(1)}%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getTrendIcon(kpis.profitMargin.trend)}
                <span className="ml-1">
                  {kpis.profitMargin.change > 0 ? '+' : ''}{kpis.profitMargin.change}% from last month
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Section */}
      {(!inventoryAlertsLoading && inventoryAlerts && inventoryAlerts.length > 0) ||
       (!paymentAlertsLoading && paymentAlerts && paymentAlerts.length > 0) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Inventory Alerts */}
          {!inventoryAlertsLoading && inventoryAlerts && inventoryAlerts.length > 0 && (
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
                  {inventoryAlerts.slice(0, 3).map((alert) => (
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
                  {inventoryAlerts.length > 3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/inventory')}
                      className="w-full mt-2"
                    >
                      View All ({inventoryAlerts.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Alerts */}
          {!paymentAlertsLoading && paymentAlerts && paymentAlerts.length > 0 && (
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
                  {paymentAlerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{alert.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.eventName} • {alert.overdueDays} days overdue
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(alert.amount)}</p>
                        <Badge variant="destructive">{alert.type}</Badge>
                      </div>
                    </div>
                  ))}
                  {paymentAlerts.length > 3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/bookings?filter=overdue')}
                      className="w-full mt-2"
                    >
                      View All ({paymentAlerts.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

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
            {bookingsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentBookings && recentBookings.length > 0 ? (
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
                      <p className="text-sm font-medium">{formatCurrency(booking.totalAmount)}</p>
                      <Badge variant={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No bookings yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Create your first booking to get started
                </p>
                <Button className="mt-4" onClick={() => navigate('/bookings/create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Booking
                </Button>
              </div>
            )}
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
            {eventsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : upcomingEvents && upcomingEvents.length > 0 ? (
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
            ) : (
              <div className="text-center py-6">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No upcoming events</h3>
                <p className="mt-2 text-muted-foreground">
                  Create your first event to get started
                </p>
                <Button className="mt-4" onClick={() => navigate('/events/create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {!activityLoading && recentActivity && recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in your system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {activity.type === 'booking_created' && <BookOpen className="h-5 w-5 text-blue-600" />}
                    {activity.type === 'payment_received' && <DollarSign className="h-5 w-5 text-green-600" />}
                    {activity.type === 'inventory_updated' && <Package className="h-5 w-5 text-orange-600" />}
                    {activity.type === 'event_created' && <Calendar className="h-5 w-5 text-purple-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                      </p>
                      {activity.amount && (
                        <p className="text-xs font-medium text-green-600">
                          {formatCurrency(activity.amount)}
                        </p>
                      )}
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
