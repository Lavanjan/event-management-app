import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertTriangle,
  Activity,
  BarChart3
} from 'lucide-react';
import { useDashboardStats } from '../../hooks/useDashboard';
import { useOrganizations } from '../../hooks/useOrganizations';
import { useCurrency } from '../../contexts/CurrencyContext';

export function ProductAdminDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();

  // Use real API data instead of mock data
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: organizationsData, isLoading: orgsLoading } = useOrganizations({
    page: 1,
    limit: 5,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Extract real data or provide default values
  const systemStats = {
    totalOrganizations: {
      value: dashboardStats?.overview?.totalOrganizations || 0,
      change: dashboardStats?.overview?.organizationsGrowth || 0,
      trend: (dashboardStats?.overview?.organizationsGrowth || 0) >= 0 ? 'up' as const : 'down' as const
    },
    totalUsers: {
      value: dashboardStats?.overview?.totalUsers || 0,
      change: dashboardStats?.overview?.usersGrowth || 0,
      trend: (dashboardStats?.overview?.usersGrowth || 0) >= 0 ? 'up' as const : 'down' as const
    },
    totalRevenue: {
      value: dashboardStats?.overview?.totalRevenue || 0,
      change: dashboardStats?.overview?.revenueGrowth || 0,
      trend: (dashboardStats?.overview?.revenueGrowth || 0) >= 0 ? 'up' as const : 'down' as const
    },
    systemHealth: {
      value: dashboardStats?.overview?.systemHealth || 99.9,
      change: dashboardStats?.overview?.healthChange || 0,
      trend: (dashboardStats?.overview?.healthChange || 0) >= 0 ? 'up' as const : 'down' as const
    }
  };

  const recentOrganizations = Array.isArray(organizationsData?.data) ? organizationsData.data : [];
  const systemAlerts = dashboardStats?.systemAlerts || [];



  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'inactive':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            System Overview
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage the entire Event Booking platform
          </p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <Button onClick={() => navigate('/organizations')}>
            <Plus className="mr-2 h-4 w-4" />
            New Organization
          </Button>
        </div>
      </div>

      {/* System KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(systemStats.totalOrganizations.value)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(systemStats.totalOrganizations.trend)}
              <span className="ml-1">
                +{systemStats.totalOrganizations.change}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(systemStats.totalUsers.value)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(systemStats.totalUsers.trend)}
              <span className="ml-1">
                +{systemStats.totalUsers.change}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(systemStats.totalRevenue.value)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(systemStats.totalRevenue.trend)}
              <span className="ml-1">
                +{systemStats.totalRevenue.change}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.systemHealth.value}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(systemStats.systemHealth.trend)}
              <span className="ml-1">
                +{systemStats.systemHealth.change}% uptime
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800 dark:text-orange-200">
              <AlertTriangle className="mr-2 h-5 w-5" />
              System Alerts
            </CardTitle>
            <CardDescription>Issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">Type: {alert.type}</p>
                  </div>
                  <Badge variant={getSeverityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Organizations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Organizations</CardTitle>
              <CardDescription>Latest organizations on the platform</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/organizations')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrganizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => navigate(`/organizations/${org.id}`)}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground">{org.users} users</p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(org.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium">{formatAmount(org.revenue)}</p>
                    <Badge variant={getStatusColor(org.status)}>
                      {org.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Analytics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>Key metrics and insights</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/analytics')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Organizations</span>
                <span className="text-sm font-medium">22 of 25</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Users per Org</span>
                <span className="text-sm font-medium">49.9</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Monthly Growth Rate</span>
                <span className="text-sm font-medium text-green-600">+12%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Support Tickets</span>
                <span className="text-sm font-medium">3 open</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
