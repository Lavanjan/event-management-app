import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(SecureAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  async getStats(@CurrentOrganization() organizationId: string) {
    return this.dashboardService.getStats(organizationId);
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get dashboard chart data' })
  @ApiResponse({ status: 200, description: 'Chart data retrieved successfully' })
  async getChartData(@Query('period') period: '7d' | '30d' | '90d' | '1y' = '30d', @CurrentOrganization() organizationId: string) {
    return this.dashboardService.getChartData(period, organizationId);
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Get recent activity' })
  @ApiResponse({ status: 200, description: 'Recent activity retrieved successfully' })
  async getRecentActivity(@Query('limit') limit: number = 10, @CurrentOrganization() organizationId: string) {
    return this.dashboardService.getRecentActivity(limit, organizationId);
  }

  @Get('upcoming-events')
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiResponse({ status: 200, description: 'Upcoming events retrieved successfully' })
  async getUpcomingEvents(@Query('limit') limit: number = 5, @CurrentOrganization() organizationId: string) {
    return this.dashboardService.getUpcomingEvents(limit, organizationId);
  }

  @Get('recent-bookings')
  @ApiOperation({ summary: 'Get recent bookings' })
  @ApiResponse({ status: 200, description: 'Recent bookings retrieved successfully' })
  async getRecentBookings(@Query('limit') limit: number = 10, @CurrentOrganization() organizationId: string) {
    return this.dashboardService.getRecentBookings(limit, organizationId);
  }

  @Get('inventory-alerts')
  @ApiOperation({ summary: 'Get inventory alerts' })
  @ApiResponse({ status: 200, description: 'Inventory alerts retrieved successfully' })
  async getInventoryAlerts(@CurrentOrganization() organizationId: string) {
    return this.dashboardService.getInventoryAlerts(organizationId);
  }

  @Get('payment-alerts')
  @ApiOperation({ summary: 'Get payment alerts' })
  @ApiResponse({ status: 200, description: 'Payment alerts retrieved successfully' })
  async getPaymentAlerts(@CurrentOrganization() organizationId: string) {
    return this.dashboardService.getPaymentAlerts(organizationId);
  }

  @Get('financial-summary')
  @ApiOperation({ summary: 'Get financial summary' })
  @ApiResponse({ status: 200, description: 'Financial summary retrieved successfully' })
  async getFinancialSummary(@CurrentOrganization() organizationId: string) {
    return this.dashboardService.getFinancialSummary(organizationId);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Get key performance indicators' })
  @ApiResponse({ status: 200, description: 'KPIs retrieved successfully' })
  async getKPIs(@CurrentOrganization() organizationId: string) {
    return this.dashboardService.getKPIs(organizationId);
  }
}
