import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(SecureAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get dashboard chart data' })
  @ApiResponse({ status: 200, description: 'Chart data retrieved successfully' })
  async getChartData(@Query('period') period: '7d' | '30d' | '90d' | '1y' = '30d') {
    return this.dashboardService.getChartData(period);
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Get recent activity' })
  @ApiResponse({ status: 200, description: 'Recent activity retrieved successfully' })
  async getRecentActivity(@Query('limit') limit: number = 10) {
    return this.dashboardService.getRecentActivity(limit);
  }

  @Get('upcoming-events')
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiResponse({ status: 200, description: 'Upcoming events retrieved successfully' })
  async getUpcomingEvents(@Query('limit') limit: number = 5) {
    return this.dashboardService.getUpcomingEvents(limit);
  }

  @Get('recent-bookings')
  @ApiOperation({ summary: 'Get recent bookings' })
  @ApiResponse({ status: 200, description: 'Recent bookings retrieved successfully' })
  async getRecentBookings(@Query('limit') limit: number = 10) {
    return this.dashboardService.getRecentBookings(limit);
  }

  @Get('inventory-alerts')
  @ApiOperation({ summary: 'Get inventory alerts' })
  @ApiResponse({ status: 200, description: 'Inventory alerts retrieved successfully' })
  async getInventoryAlerts() {
    return this.dashboardService.getInventoryAlerts();
  }

  @Get('payment-alerts')
  @ApiOperation({ summary: 'Get payment alerts' })
  @ApiResponse({ status: 200, description: 'Payment alerts retrieved successfully' })
  async getPaymentAlerts() {
    return this.dashboardService.getPaymentAlerts();
  }

  @Get('financial-summary')
  @ApiOperation({ summary: 'Get financial summary' })
  @ApiResponse({ status: 200, description: 'Financial summary retrieved successfully' })
  async getFinancialSummary() {
    return this.dashboardService.getFinancialSummary();
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Get key performance indicators' })
  @ApiResponse({ status: 200, description: 'KPIs retrieved successfully' })
  async getKPIs() {
    return this.dashboardService.getKPIs();
  }
}
