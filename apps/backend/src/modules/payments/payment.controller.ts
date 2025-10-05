import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentService, CreatePaymentDto, UpdatePaymentDto, ProcessRefundDto, PaymentFilters } from './payment.service';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { SimplePermissionsGuard } from '../../common/guards/simple-permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { User } from '../../database/entities/user.entity';
import { PaymentMethod, PaymentStatus, PaymentType } from '../../database/entities/payment.entity';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(SecureAuthGuard, SimplePermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @RequirePermission('payments.create')
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: User,
  ) {
    const payment = await this.paymentService.create(createPaymentDto, organizationId, user.id);
    return {
      success: true,
      data: payment,
      message: 'Payment created successfully',
    };
  }

  @Get()
  @RequirePermission('payments.read')
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiQuery({ name: 'status', enum: PaymentStatus, required: false })
  @ApiQuery({ name: 'paymentMethod', enum: PaymentMethod, required: false })
  @ApiQuery({ name: 'paymentType', enum: PaymentType, required: false })
  @ApiQuery({ name: 'bookingId', type: 'string', required: false })
  @ApiQuery({ name: 'search', type: 'string', required: false })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  async findAll(
    @CurrentOrganization() organizationId: string,
    @Query() filters: PaymentFilters,
  ) {
    const result = await this.paymentService.findAll(organizationId, filters);
    return {
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('summary')
  @RequirePermission('payments.read')
  @ApiOperation({ summary: 'Get payment summary statistics' })
  @ApiResponse({ status: 200, description: 'Payment summary retrieved successfully' })
  async getPaymentSummary(
    @CurrentOrganization() organizationId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filters = {
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    };
    
    const summary = await this.paymentService.getPaymentSummary(organizationId, filters);
    return {
      success: true,
      data: summary,
    };
  }

  @Get('booking/:bookingId')
  @RequirePermission('payments.read')
  @ApiOperation({ summary: 'Get payments for a specific booking' })
  @ApiResponse({ status: 200, description: 'Booking payments retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getPaymentsByBooking(
    @Param('bookingId') bookingId: string,
    @CurrentOrganization() organizationId: string,
  ) {
    const payments = await this.paymentService.getPaymentsByBooking(bookingId, organizationId);
    return {
      success: true,
      data: payments,
    };
  }

  @Get(':id')
  @RequirePermission('payments.read')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentOrganization() organizationId: string,
  ) {
    const payment = await this.paymentService.findOne(id, organizationId);
    return {
      success: true,
      data: payment,
    };
  }

  @Get(':id/transactions')
  @RequirePermission('payments.read')
  @ApiOperation({ summary: 'Get payment transaction history' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getTransactionHistory(
    @Param('id') id: string,
    @CurrentOrganization() organizationId: string,
  ) {
    const transactions = await this.paymentService.getTransactionHistory(id, organizationId);
    return {
      success: true,
      data: transactions,
    };
  }

  @Patch(':id')
  @RequirePermission('payments.update')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: User,
  ) {
    const payment = await this.paymentService.update(id, updatePaymentDto, organizationId, user.id);
    return {
      success: true,
      data: payment,
      message: 'Payment updated successfully',
    };
  }

  @Post(':id/refund')
  @RequirePermission('payments.refund')
  @ApiOperation({ summary: 'Process a refund for a payment' })
  @ApiResponse({ status: 201, description: 'Refund processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid refund request' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async processRefund(
    @Param('id') id: string,
    @Body() refundDto: ProcessRefundDto,
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: User,
  ) {
    const refund = await this.paymentService.processRefund(id, refundDto, organizationId, user.id);
    return {
      success: true,
      data: refund,
      message: 'Refund processed successfully',
    };
  }

  @Delete(':id')
  @RequirePermission('payments.update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiResponse({ status: 204, description: 'Payment deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete completed payments' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async remove(
    @Param('id') id: string,
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: User,
  ) {
    await this.paymentService.delete(id, organizationId, user.id);
  }
}
