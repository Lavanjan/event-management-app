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
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireUserType } from '../auth/decorators/user-type.decorator';
import { UserType } from '../../database/entities';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { PaymentStatus } from '../../database/entities/booking.entity';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(SecureAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
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
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
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
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN, UserType.ORGANIZATION_USER)
  @ApiOperation({ summary: 'Get overdue bookings' })
  @ApiResponse({ status: 200, description: 'Overdue bookings retrieved' })
  getOverdueBookings() {
    return this.bookingsService.getOverdueBookings();
  }

  @Get('event/:eventId')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN, UserType.ORGANIZATION_USER)
  @ApiOperation({ summary: 'Get bookings for a specific event' })
  @ApiResponse({ status: 200, description: 'Event bookings retrieved' })
  getBookingsByEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query() paginationDto: PaginationDto
  ) {
    return this.bookingsService.getBookingsByEvent(eventId, paginationDto);
  }

  @Get(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN, UserType.ORGANIZATION_USER)
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking found' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.bookingsService.findById(id, organizationId);
  }

  @Patch(':id')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
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
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Confirm booking' })
  @ApiResponse({ status: 200, description: 'Booking confirmed successfully' })
  confirm(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.bookingsService.confirm(id, organizationId);
  }

  @Patch(':id/start')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Start booking event' })
  @ApiResponse({ status: 200, description: 'Event started successfully' })
  start(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.bookingsService.start(id, organizationId);
  }

  @Patch(':id/complete')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Complete booking' })
  @ApiResponse({ status: 200, description: 'Booking completed successfully' })
  complete(@Param('id', ParseUUIDPipe) id: string, @CurrentOrganization() organizationId: string) {
    return this.bookingsService.complete(id, organizationId);
  }

  @Patch(':id/cancel')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
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
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
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
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
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
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
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
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Remove expense from booking' })
  @ApiResponse({ status: 200, description: 'Expense removed successfully' })
  removeExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('expenseId', ParseUUIDPipe) expenseId: string
  ) {
    return this.bookingsService.removeExpense(id, expenseId);
  }

  @Delete(':id/revenues/:revenueId')
  @RequireUserType(UserType.PRODUCT_ADMIN, UserType.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Remove revenue from booking' })
  @ApiResponse({ status: 200, description: 'Revenue removed successfully' })
  removeRevenue(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('revenueId', ParseUUIDPipe) revenueId: string
  ) {
    return this.bookingsService.removeRevenue(id, revenueId);
  }
}
