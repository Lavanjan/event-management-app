import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { FinancialService } from './financial.service';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireUserType } from '../auth/decorators/user-type.decorator';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { UserType } from '../../database/entities';

@ApiTags('Financial')
@Controller('financial')
@UseGuards(SecureAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('summary')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get financial summary' })
  @ApiResponse({ status: 200, description: 'Financial summary retrieved' })
  getFinancialSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @CurrentOrganization() organizationId?: string
  ) {
    return this.financialService.getFinancialSummary(from, to, organizationId);
  }

  @Get('revenue')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get revenue report' })
  @ApiResponse({ status: 200, description: 'Revenue report retrieved' })
  getRevenueReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @CurrentOrganization() organizationId?: string
  ) {
    return this.financialService.getRevenueReport(from, to, organizationId);
  }

  @Get('expenses')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get expense report' })
  @ApiResponse({ status: 200, description: 'Expense report retrieved' })
  getExpenseReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @CurrentOrganization() organizationId?: string
  ) {
    return this.financialService.getExpenseReport(from, to, organizationId);
  }

  @Get('profit-loss')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get profit & loss report' })
  @ApiResponse({ status: 200, description: 'Profit & loss report retrieved' })
  getProfitLossReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @CurrentOrganization() organizationId?: string
  ) {
    return this.financialService.getProfitLossReport(from, to, organizationId);
  }

  @Get('export')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Export financial report' })
  @ApiResponse({ status: 200, description: 'Report exported successfully' })
  exportReport(
    @Query('format') format: 'pdf' | 'excel',
    @Query('from') from?: string,
    @Query('to') to?: string,
    @CurrentOrganization() organizationId?: string
  ) {
    return this.financialService.exportReport(format, from, to, organizationId);
  }
}
