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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { AddExpenseDto } from './dto/add-expense.dto';
import { AddRevenueDto } from './dto/add-revenue.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BookingFiltersDto } from './dto/booking-filters.dto';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { ComprehensivePermissionGuard, RequirePermission } from '../../common/guards/comprehensive-permission.guard';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { BookingPaymentStatus } from '../../database/entities/booking.entity';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(SecureAuthGuard, ComprehensivePermissionGuard)
@ApiBearerAuth('JWT-auth')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @RequirePermission('bookings.create')
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or insufficient inventory' })
  create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentOrganization() organizationId: string
  ) {
    console.log('Received booking data:', JSON.stringify(createBookingDto, null, 2));
    console.log('startDate type:', typeof createBookingDto.startDate);
    console.log('endDate type:', typeof createBookingDto.endDate);
    return this.bookingsService.create(createBookingDto, organizationId);
  }

  @Get()
  @RequirePermission('bookings.read')
  @ApiOperation({ summary: 'Get all bookings with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'paymentStatus', required: false, type: String, description: 'Comma-separated payment statuses' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'eventId', required: false, type: String })
  @ApiQuery({ name: 'customer', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  findAll(@Query() filtersDto: BookingFiltersDto, @CurrentOrganization() organizationId: string) {
    return this.bookingsService.findAll(filtersDto, organizationId);
  }

  @Get('overdue')
  @RequirePermission('bookings.read')
  @ApiOperation({ summary: 'Get overdue bookings' })
  @ApiResponse({ status: 200, description: 'Overdue bookings retrieved' })
  getOverdueBookings() {
    return this.bookingsService.getOverdueBookings();
  }

  @Get('event/:eventId')
  @RequirePermission('bookings.read')
  @ApiOperation({ summary: 'Get bookings for a specific event' })
  @ApiResponse({ status: 200, description: 'Event bookings retrieved' })
  getBookingsByEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query() paginationDto: PaginationDto
  ) {
    return this.bookingsService.getBookingsByEvent(eventId, paginationDto);
  }

  @Get(':id')
  @RequirePermission('bookings.read')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking found' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.bookingsService.findById(id, organizationId);
  }

  @Patch(':id')
  @RequirePermission('bookings.update')
  @ApiOperation({ summary: 'Update booking' })
  @ApiResponse({ status: 200, description: 'Booking updated successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.bookingsService.update(id, updateBookingDto, organizationId);
  }

  @Patch(':id/confirm')
  @RequirePermission('bookings.update')
  @ApiOperation({ summary: 'Confirm booking' })
  @ApiResponse({ status: 200, description: 'Booking confirmed successfully' })
  confirm(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.bookingsService.confirm(id, organizationId);
  }

  @Patch(':id/start')
  @RequirePermission('bookings.update')
  @ApiOperation({ summary: 'Start booking event' })
  @ApiResponse({ status: 200, description: 'Event started successfully' })
  start(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.bookingsService.start(id, organizationId);
  }

  @Patch(':id/complete')
  @RequirePermission('bookings.update')
  @ApiOperation({ summary: 'Complete booking' })
  @ApiResponse({ status: 200, description: 'Booking completed successfully' })
  complete(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.bookingsService.complete(id, organizationId);
  }

  @Patch(':id/cancel')
  @RequirePermission('bookings.cancel')
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOrganization() organizationId: string,
    @Body('reason') reason?: string
  ) {
    return this.bookingsService.cancel(id, organizationId, reason);
  }

  @Patch(':id/payment-status')
  @RequirePermission('bookings.update')
  @ApiOperation({ summary: 'Update payment status' })
  @ApiResponse({ status: 200, description: 'Payment status updated' })
  updatePaymentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('paymentStatus') paymentStatus: BookingPaymentStatus,
    @CurrentOrganization() organizationId: string
  ) {
    return this.bookingsService.updatePaymentStatus(id, paymentStatus, organizationId);
  }

  @Post(':id/expenses')
  @RequirePermission('bookings.update')
  @ApiOperation({ summary: 'Add expense to booking' })
  @ApiResponse({ status: 201, description: 'Expense added successfully' })
  addExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addExpenseDto: AddExpenseDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.bookingsService.addExpense(id, addExpenseDto, organizationId);
  }

  @Post(':id/revenues')
  @RequirePermission('bookings.update')
  @ApiOperation({ summary: 'Add revenue to booking' })
  @ApiResponse({ status: 201, description: 'Revenue added successfully' })
  addRevenue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addRevenueDto: AddRevenueDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.bookingsService.addRevenue(id, addRevenueDto, organizationId);
  }

  @Delete(':id/expenses/:expenseId')
  @RequirePermission('bookings.update')
  @ApiOperation({ summary: 'Remove expense from booking' })
  @ApiResponse({ status: 200, description: 'Expense removed successfully' })
  removeExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('expenseId', ParseUUIDPipe) expenseId: string
  ) {
    return this.bookingsService.removeExpense(id, expenseId);
  }

  @Delete(':id/revenues/:revenueId')
  @RequirePermission('bookings.update')
  @ApiOperation({ summary: 'Remove revenue from booking' })
  @ApiResponse({ status: 200, description: 'Revenue removed successfully' })
  removeRevenue(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('revenueId', ParseUUIDPipe) revenueId: string
  ) {
    return this.bookingsService.removeRevenue(id, revenueId);
  }
}
