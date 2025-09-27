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
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { PaymentStatus } from '../../database/entities/booking.entity';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(SecureAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @RequirePermissions({ resource: 'bookings', action: 'create' })
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or insufficient inventory' })
  create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentOrganization() organizationId: string
  ) {
    return this.bookingsService.create(createBookingDto, organizationId);
  }

  @Get()
  @RequirePermissions({ resource: 'bookings', action: 'read' })
  @ApiOperation({ summary: 'Get all bookings with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  findAll(@Query() paginationDto: PaginationDto, @CurrentOrganization() organizationId: string) {
    return this.bookingsService.findAll(paginationDto, organizationId);
  }

  @Get('overdue')
  @RequirePermissions({ resource: 'bookings', action: 'read' })
  @ApiOperation({ summary: 'Get overdue bookings' })
  @ApiResponse({ status: 200, description: 'Overdue bookings retrieved' })
  getOverdueBookings() {
    return this.bookingsService.getOverdueBookings();
  }

  @Get('event/:eventId')
  @RequirePermissions({ resource: 'bookings', action: 'read' })
  @ApiOperation({ summary: 'Get bookings for a specific event' })
  @ApiResponse({ status: 200, description: 'Event bookings retrieved' })
  getBookingsByEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query() paginationDto: PaginationDto
  ) {
    return this.bookingsService.getBookingsByEvent(eventId, paginationDto);
  }

  @Get(':id')
  @RequirePermissions({ resource: 'bookings', action: 'read' })
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking found' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.bookingsService.findById(id, organizationId);
  }

  @Patch(':id')
  @RequirePermissions({ resource: 'bookings', action: 'update' })
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
  @RequirePermissions({ resource: 'bookings', action: 'update' })
  @ApiOperation({ summary: 'Confirm booking' })
  @ApiResponse({ status: 200, description: 'Booking confirmed successfully' })
  confirm(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.bookingsService.confirm(id, organizationId);
  }

  @Patch(':id/complete')
  @RequirePermissions({ resource: 'bookings', action: 'update' })
  @ApiOperation({ summary: 'Complete booking' })
  @ApiResponse({ status: 200, description: 'Booking completed successfully' })
  complete(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.bookingsService.complete(id, organizationId);
  }

  @Patch(':id/cancel')
  @RequirePermissions({ resource: 'bookings', action: 'update' })
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
  @RequirePermissions({ resource: 'bookings', action: 'update' })
  @ApiOperation({ summary: 'Update payment status' })
  @ApiResponse({ status: 200, description: 'Payment status updated' })
  updatePaymentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('paymentStatus') paymentStatus: PaymentStatus,
    @CurrentOrganization() organizationId: string
  ) {
    return this.bookingsService.updatePaymentStatus(id, paymentStatus, organizationId);
  }

  @Post(':id/expenses')
  @RequirePermissions({ resource: 'expenses', action: 'manage' })
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
  @RequirePermissions({ resource: 'revenues', action: 'manage' })
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
  @RequirePermissions({ resource: 'expenses', action: 'manage' })
  @ApiOperation({ summary: 'Remove expense from booking' })
  @ApiResponse({ status: 200, description: 'Expense removed successfully' })
  removeExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('expenseId', ParseUUIDPipe) expenseId: string
  ) {
    return this.bookingsService.removeExpense(id, expenseId);
  }

  @Delete(':id/revenues/:revenueId')
  @RequirePermissions({ resource: 'revenues', action: 'manage' })
  @ApiOperation({ summary: 'Remove revenue from booking' })
  @ApiResponse({ status: 200, description: 'Revenue removed successfully' })
  removeRevenue(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('revenueId', ParseUUIDPipe) revenueId: string
  ) {
    return this.bookingsService.removeRevenue(id, revenueId);
  }
}
