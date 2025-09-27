import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { FinancialService } from './financial.service';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Financial')
@Controller('financial')
@UseGuards(SecureAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('summary')
  @RequirePermissions({ resource: 'reports', action: 'read' })
  @ApiOperation({ summary: 'Get financial summary' })
  @ApiResponse({ status: 200, description: 'Financial summary retrieved' })
  getFinancialSummary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.financialService.getFinancialSummary(from, to);
  }

  @Get('revenue')
  @RequirePermissions({ resource: 'reports', action: 'read' })
  @ApiOperation({ summary: 'Get revenue report' })
  @ApiResponse({ status: 200, description: 'Revenue report retrieved' })
  getRevenueReport(@Query('from') from?: string, @Query('to') to?: string) {
    return this.financialService.getRevenueReport(from, to);
  }

  @Get('expenses')
  @RequirePermissions({ resource: 'reports', action: 'read' })
  @ApiOperation({ summary: 'Get expense report' })
  @ApiResponse({ status: 200, description: 'Expense report retrieved' })
  getExpenseReport(@Query('from') from?: string, @Query('to') to?: string) {
    return this.financialService.getExpenseReport(from, to);
  }

  @Get('export')
  @RequirePermissions({ resource: 'reports', action: 'read' })
  @ApiOperation({ summary: 'Export financial report' })
  @ApiResponse({ status: 200, description: 'Report exported successfully' })
  exportReport(
    @Query('format') format: 'pdf' | 'excel',
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.financialService.exportReport(format, from, to);
  }
}
