import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { PaymentsService } from './payments.service';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireUserType } from '../auth/decorators/user-type.decorator';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { UserType, PaymentStatus } from '../../database/entities';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { 
  CreatePaymentRecordDto, 
  PaymentReminderDto, 
  BulkPaymentReminderDto,
  ProcessRefundDto,
  ValidatePaymentDto,
  BulkUpdatePaymentStatusDto,
} from './dto/payment.dto';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(SecureAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('summary')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get payment summary and statistics' })
  @ApiResponse({ status: 200, description: 'Payment summary retrieved' })
  getPaymentSummary(
    @Query() paginationDto: PaginationDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.paymentsService.getPaymentSummary(paginationDto, organizationId);
  }

  @Get('overdue')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get overdue payments' })
  @ApiResponse({ status: 200, description: 'Overdue payments retrieved' })
  getOverduePayments(@CurrentOrganization() organizationId: string) {
    return this.paymentsService.getOverduePayments(organizationId);
  }

  @Get('analytics')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get payment analytics' })
  @ApiResponse({ status: 200, description: 'Payment analytics retrieved' })
  getPaymentAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @CurrentOrganization() organizationId?: string
  ) {
    return this.paymentsService.getPaymentAnalytics(from, to, organizationId);
  }

  @Get('methods')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get available payment methods' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved' })
  getPaymentMethods(@CurrentOrganization() organizationId: string) {
    return this.paymentsService.getPaymentMethods(organizationId);
  }

  @Get('calendar')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get payment calendar for a specific month' })
  @ApiResponse({ status: 200, description: 'Payment calendar retrieved' })
  getPaymentCalendar(
    @Query('month') month: string,
    @Query('year') year: string,
    @CurrentOrganization() organizationId: string
  ) {
    return this.paymentsService.getPaymentCalendar(month, year, organizationId);
  }

  @Get('booking/:bookingId/history')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get payment history for a specific booking' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved' })
  getPaymentHistory(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @CurrentOrganization() organizationId: string
  ) {
    return this.paymentsService.getPaymentHistory(bookingId, organizationId);
  }

  @Post('record')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Record a new payment' })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  recordPayment(
    @Body() createPaymentDto: CreatePaymentRecordDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.paymentsService.recordPayment(createPaymentDto, organizationId);
  }

  @Post('send-reminder')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Send payment reminder to customer' })
  @ApiResponse({ status: 200, description: 'Payment reminder sent successfully' })
  @HttpCode(HttpStatus.OK)
  sendPaymentReminder(
    @Body() reminderDto: PaymentReminderDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.paymentsService.sendPaymentReminder(reminderDto, organizationId);
  }

  @Post('send-bulk-reminders')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Send bulk payment reminders' })
  @ApiResponse({ status: 200, description: 'Bulk reminders sent successfully' })
  @HttpCode(HttpStatus.OK)
  sendBulkReminders(
    @Body() bulkReminderDto: BulkPaymentReminderDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.paymentsService.sendBulkReminders(bulkReminderDto, organizationId);
  }

  @Post('refund')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Process a refund' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @HttpCode(HttpStatus.OK)
  processRefund(
    @Body() refundDto: ProcessRefundDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.paymentsService.processRefund(refundDto, organizationId);
  }

  @Post('validate')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Validate a payment transaction' })
  @ApiResponse({ status: 200, description: 'Payment validation result' })
  @HttpCode(HttpStatus.OK)
  validatePayment(
    @Body() validateDto: ValidatePaymentDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.paymentsService.validatePayment(validateDto, organizationId);
  }

  @Patch('bulk-update-status')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Bulk update payment status for multiple bookings' })
  @ApiResponse({ status: 200, description: 'Payment statuses updated successfully' })
  bulkUpdatePaymentStatus(
    @Body() bulkUpdateDto: BulkUpdatePaymentStatusDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.paymentsService.bulkUpdatePaymentStatus(bulkUpdateDto, organizationId);
  }

  @Get('report')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Generate payment report' })
  @ApiResponse({ status: 200, description: 'Payment report generated' })
  generatePaymentReport(
    @Query() paginationDto: PaginationDto,
    @Query('format') format: 'pdf' | 'excel' = 'pdf',
    @CurrentOrganization() organizationId: string
  ) {
    return this.paymentsService.generatePaymentReport(paginationDto, format, organizationId);
  }

  @Get('export')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Export payment data' })
  @ApiResponse({ status: 200, description: 'Payment data exported' })
  exportPayments(
    @Query() paginationDto: PaginationDto,
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
    @CurrentOrganization() organizationId: string
  ) {
    return this.paymentsService.exportPayments(paginationDto, format, organizationId);
  }
}
