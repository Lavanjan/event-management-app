import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';

import { Booking, BookingStatus, BookingPaymentStatus } from '../../database/entities/booking.entity';
import { BookingInventoryAllocation } from '../../database/entities/booking-inventory-allocation.entity';
import { BookingExpense } from '../../database/entities/booking-expense.entity';
import { BookingRevenue } from '../../database/entities/booking-revenue.entity';
import { Event } from '../../database/entities/event.entity';
import { InventoryItem } from '../../database/entities/inventory-item.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { AddExpenseDto } from './dto/add-expense.dto';
import { AddRevenueDto } from './dto/add-revenue.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { BookingFiltersDto } from './dto/booking-filters.dto';
import { InventoryService } from '../inventory/inventory.service';
import { EventsService } from '../events/events.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(BookingInventoryAllocation)
    private allocationRepository: Repository<BookingInventoryAllocation>,
    @InjectRepository(BookingExpense)
    private expenseRepository: Repository<BookingExpense>,
    @InjectRepository(BookingRevenue)
    private revenueRepository: Repository<BookingRevenue>,
    private inventoryService: InventoryService,
    private eventsService: EventsService,
    private emailService: EmailService,
    private dataSource: DataSource
  ) {}

  async create(createBookingDto: CreateBookingDto, organizationId: string): Promise<Booking> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate event exists within the organization
      const event = await this.eventsService.findById(createBookingDto.eventId, organizationId);

      if (!event.isActive) {
        throw new BadRequestException('Event type is not active');
      }

      // Calculate start and end dates based on booking type
      let startDate: Date;
      let endDate: Date;
      let halfDaySlot: 'morning' | 'evening' | undefined;

      const inputDate = new Date(createBookingDto.startDate);

      if (inputDate <= new Date()) {
        throw new BadRequestException('Booking date must be in the future');
      }

      if (createBookingDto.durationType === 'hourly') {
        // Hour basis: user provides start time, we calculate end time
        if (!createBookingDto.durationHours || createBookingDto.durationHours <= 0) {
          throw new BadRequestException('Duration hours is required for hourly bookings');
        }
        startDate = new Date(createBookingDto.startDate);
        endDate = new Date(startDate.getTime() + createBookingDto.durationHours * 60 * 60 * 1000);
      } else if (createBookingDto.durationType === 'half_day') {
        // Half day: fixed slots (morning or evening)
        if (!createBookingDto.halfDaySlot) {
          throw new BadRequestException(
            'Half day slot (morning/evening) is required for half day bookings'
          );
        }
        halfDaySlot = createBookingDto.halfDaySlot;

        const year = inputDate.getFullYear();
        const month = inputDate.getMonth();
        const day = inputDate.getDate();

        if (halfDaySlot === 'morning') {
          // Morning: 08:00 - 12:00
          startDate = new Date(year, month, day, 8, 0, 0);
          endDate = new Date(year, month, day, 12, 0, 0);
        } else {
          // Evening: 13:00 - 17:00
          startDate = new Date(year, month, day, 13, 0, 0);
          endDate = new Date(year, month, day, 17, 0, 0);
        }
      } else if (createBookingDto.durationType === 'full_day') {
        // Full day: entire day (00:00 - 23:59)
        const year = inputDate.getFullYear();
        const month = inputDate.getMonth();
        const day = inputDate.getDate();

        startDate = new Date(year, month, day, 0, 0, 0);
        endDate = new Date(year, month, day, 23, 59, 59);
      } else {
        throw new BadRequestException('Invalid duration type');
      }

      // Calculate base price from event type
      let basePrice = 0;
      if (createBookingDto.durationType === 'hourly' && createBookingDto.durationHours) {
        basePrice = event.calculatePrice('hourly', createBookingDto.durationHours);
      } else if (createBookingDto.durationType === 'half_day') {
        basePrice = event.calculatePrice('half_day');
      } else if (createBookingDto.durationType === 'full_day') {
        basePrice = event.calculatePrice('full_day');
      }

      // Calculate inventory total
      let inventoryTotal = 0;
      const allocations: BookingInventoryAllocation[] = [];
      const inventoryItemsMap = new Map<string, any>(); // Store fetched items

      if (
        createBookingDto.inventoryAllocations &&
        createBookingDto.inventoryAllocations.length > 0
      ) {
        if (!event.allowInventoryAllocation) {
          throw new BadRequestException('Inventory allocation not allowed for this event');
        }

        for (const allocation of createBookingDto.inventoryAllocations) {
          const item = await this.inventoryService.findById(
            allocation.inventoryItemId,
            organizationId
          );

          // Store item in map for later use
          inventoryItemsMap.set(allocation.inventoryItemId, item);

          if (!item.canAllocate(allocation.quantity)) {
            throw new BadRequestException(
              `Cannot allocate ${allocation.quantity} of ${item.name}. Only ${item.availableQuantity} available.`
            );
          }

          const allocationEntity = this.allocationRepository.create({
            inventoryItemId: allocation.inventoryItemId,
            quantity: allocation.quantity,
            unitPrice: item.unitPrice,
            totalPrice: allocation.quantity * item.unitPrice,
          });

          allocations.push(allocationEntity);
          inventoryTotal += allocationEntity.totalPrice;

          // Allocate inventory
          await this.inventoryService.allocateQuantity(
            allocation.inventoryItemId,
            allocation.quantity,
            organizationId
          );
        }
      }

      // Calculate total amount (ONLY base price, inventory is NOT included)
      // Inventory costs will be tracked as expenses
      const totalAmount = basePrice;
      const advanceAmount = event.calculateAdvanceAmount(totalAmount);
      const balanceAmount = event.calculateBalanceAmount(totalAmount, advanceAmount);

      // Calculate due dates
      const advanceDueDate = new Date(); // Advance due immediately
      const balanceDueDate = event.calculateBalanceDueDate(startDate);

      // Create booking with confirmed status
      const booking = this.bookingRepository.create({
        ...createBookingDto,
        organizationId,
        startDate,
        endDate,
        halfDaySlot,
        totalAmount,
        advanceAmount,
        balanceAmount,
        advanceDueDate,
        balanceDueDate,
        status: BookingStatus.CONFIRMED, // Set status to confirmed on creation
        inventoryAllocations: allocations,
      });

      // Automatically create expenses for inventory allocations
      const inventoryExpenses = allocations.map(allocation => {
        const item = inventoryItemsMap.get(allocation.inventoryItemId);
        return this.expenseRepository.create({
          name: `Inventory: ${item?.name || 'Item'}`,
          amount: allocation.totalPrice,
          category: 'Inventory',
          description: `${allocation.quantity} units @ $${allocation.unitPrice}`,
        });
      });

      // Add user-provided expenses if any
      const userExpenses = createBookingDto.expenses
        ? createBookingDto.expenses.map(expense => this.expenseRepository.create(expense))
        : [];

      // Combine inventory expenses with user expenses
      booking.expenses = [...inventoryExpenses, ...userExpenses];

      // Add booking fee as initial revenue
      const bookingRevenue = this.revenueRepository.create({
        name: 'Booking Fee',
        amount: totalAmount,
        category: 'Booking',
        description: `${event.name} - ${createBookingDto.durationType} booking`,
      });

      // Add user-provided revenues if any
      const userRevenues = createBookingDto.revenues
        ? createBookingDto.revenues.map(revenue => this.revenueRepository.create(revenue))
        : [];

      // Combine booking revenue with user revenues
      booking.revenues = [bookingRevenue, ...userRevenues];

      // Save booking - this will trigger the exclusion constraint if there's an overlap
      let savedBooking: Booking;
      try {
        savedBooking = await queryRunner.manager.save(booking);
      } catch (dbError) {
        // Check if error is due to exclusion constraint violation
        if (dbError.code === '23P01' || dbError.constraint === 'bookings_no_overlap_excl') {
          throw new ConflictException(
            'This time slot is already booked for this event. Please choose a different date or time.'
          );
        }
        throw dbError;
      }

      await queryRunner.commitTransaction();

      // Send confirmation email to customer
      try {
        await this.sendBookingConfirmationEmail(savedBooking, event);
      } catch (emailError) {
        // Log email error but don't fail the booking creation
        console.error('Failed to send booking confirmation email:', emailError);
      }

      return this.findById(savedBooking.id, organizationId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async sendBookingConfirmationEmail(booking: Booking, event: Event): Promise<void> {
    const subject = `Booking Confirmation - ${event.name}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .booking-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .detail-row { display: flex; justify-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; }
          .total { font-size: 18px; font-weight: bold; color: #4f46e5; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmation</h1>
          </div>
          <div class="content">
            <p>Dear ${booking.customerName},</p>
            <p>Thank you for your booking! Your reservation has been confirmed.</p>

            <div class="booking-details">
              <h2>Booking Details</h2>
              <div class="detail-row">
                <span class="detail-label">Event Type:</span>
                <span>${event.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span>${event.location || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date:</span>
                <span>${new Date(booking.startDate).toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">End Date:</span>
                <span>${new Date(booking.endDate).toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration Type:</span>
                <span>${booking.durationType.replace('_', ' ').toUpperCase()}</span>
              </div>
              ${
                booking.durationHours
                  ? `
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span>${booking.durationHours} hours</span>
              </div>
              `
                  : ''
              }
            </div>

            <div class="booking-details">
              <h2>Payment Information</h2>
              <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="total">$${booking.totalAmount.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Advance Payment:</span>
                <span>$${booking.advanceAmount.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Balance Amount:</span>
                <span>$${booking.balanceAmount.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Balance Due Date:</span>
                <span>${new Date(booking.balanceDueDate).toLocaleDateString()}</span>
              </div>
            </div>

            ${
              booking.notes
                ? `
            <div class="booking-details">
              <h3>Additional Notes</h3>
              <p>${booking.notes}</p>
            </div>
            `
                : ''
            }

            <p>If you have any questions or need to make changes to your booking, please contact us.</p>
            <p>We look forward to serving you!</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Booking Confirmation

Dear ${booking.customerName},

Thank you for your booking! Your reservation has been confirmed.

Booking Details:
- Event Type: ${event.name}
- Location: ${event.location || 'N/A'}
- Start Date: ${new Date(booking.startDate).toLocaleString()}
- End Date: ${new Date(booking.endDate).toLocaleString()}
- Duration Type: ${booking.durationType.replace('_', ' ').toUpperCase()}
${booking.durationHours ? `- Duration: ${booking.durationHours} hours` : ''}

Payment Information:
- Total Amount: $${booking.totalAmount.toFixed(2)}
- Advance Payment: $${booking.advanceAmount.toFixed(2)}
- Balance Amount: $${booking.balanceAmount.toFixed(2)}
- Balance Due Date: ${new Date(booking.balanceDueDate).toLocaleDateString()}

${booking.notes ? `Additional Notes:\n${booking.notes}` : ''}

If you have any questions or need to make changes to your booking, please contact us.

We look forward to serving you!
    `;

    // Use the email service's sendBookingConfirmation method
    await this.emailService.sendBookingConfirmation(
      booking.customerEmail,
      subject,
      htmlContent,
      textContent
    );
  }

  private async sendBookingUpdateEmail(booking: Booking, event: Event): Promise<void> {
    const subject = `Booking Updated - ${event.name}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .payment-info { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          h1, h2, h3 { margin-top: 0; }
          .amount { font-weight: bold; color: #059669; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Booking Updated</h1>
        </div>
        <div class="content">
          <p>Dear ${booking.customerName},</p>

          <p>Your booking has been updated. Please review the updated details below:</p>

          <div class="booking-details">
            <h3>Updated Booking Details</h3>
            <p><strong>Event Type:</strong> ${event.name}</p>
            <p><strong>Location:</strong> ${event.location || 'N/A'}</p>
            <p><strong>Start Date:</strong> ${new Date(booking.startDate).toLocaleString()}</p>
            <p><strong>End Date:</strong> ${new Date(booking.endDate).toLocaleString()}</p>
            <p><strong>Duration Type:</strong> ${booking.durationType
              .replace('_', ' ')
              .toUpperCase()}</p>
            ${
              booking.durationHours
                ? `<p><strong>Duration:</strong> ${booking.durationHours} hours</p>`
                : ''
            }
          </div>

          <div class="payment-info">
            <h3>Updated Payment Information</h3>
            <p><strong>Total Amount:</strong> <span class="amount">$${
              booking.totalAmount
            }</span></p>
            <p><strong>Advance Payment:</strong> <span class="amount">$${
              booking.advanceAmount
            }</span></p>
            <p><strong>Balance Amount:</strong> <span class="amount">$${
              booking.balanceAmount
            }</span></p>
            <p><strong>Balance Due Date:</strong> ${new Date(
              booking.balanceDueDate
            ).toLocaleDateString()}</p>
          </div>

          ${
            booking.notes
              ? `
          <div class="booking-details">
            <h3>Additional Notes</h3>
            <p>${booking.notes}</p>
          </div>
          `
              : ''
          }

          <p>If you have any questions about these changes or need further assistance, please contact us.</p>
          <p>Thank you for choosing our services!</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Booking Updated

Dear ${booking.customerName},

Your booking has been updated. Please review the updated details below:

Updated Booking Details:
- Event Type: ${event.name}
- Location: ${event.location || 'N/A'}
- Start Date: ${new Date(booking.startDate).toLocaleString()}
- End Date: ${new Date(booking.endDate).toLocaleString()}
- Duration Type: ${booking.durationType.replace('_', ' ').toUpperCase()}
${booking.durationHours ? `- Duration: ${booking.durationHours} hours` : ''}

Updated Payment Information:
- Total Amount: $${booking.totalAmount}
- Advance Payment: $${booking.advanceAmount}
- Balance Amount: $${booking.balanceAmount}
- Balance Due Date: ${new Date(booking.balanceDueDate).toLocaleDateString()}

${booking.notes ? `Additional Notes:\n${booking.notes}` : ''}

If you have any questions about these changes or need further assistance, please contact us.

Thank you for choosing our services!
    `;

    // Use the email service's sendBookingConfirmation method
    await this.emailService.sendBookingConfirmation(
      booking.customerEmail,
      subject,
      htmlContent,
      textContent
    );
  }

  async findAll(
    filtersDto: BookingFiltersDto,
    organizationId: string
  ): Promise<PaginatedResponseDto<Booking>> {
    const { page, limit, search, sortBy, sortOrder, paymentStatus, status, eventId, customer } = filtersDto;

    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.event', 'event')
      .leftJoinAndSelect('booking.inventoryAllocations', 'allocations')
      .leftJoinAndSelect('allocations.inventoryItem', 'item')
      .leftJoinAndSelect('booking.expenses', 'expenses')
      .leftJoinAndSelect('booking.revenues', 'revenues');

    // Organization filter (most important - always applied)
    queryBuilder.where('booking.organizationId = :organizationId', { organizationId });

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(booking.customerName ILIKE :search OR booking.customerEmail ILIKE :search OR event.name ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Payment status filter
    if (paymentStatus && paymentStatus.length > 0) {
      queryBuilder.andWhere('booking.paymentStatus IN (:...paymentStatus)', { paymentStatus });
    }

    // Booking status filter
    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    // Event filter
    if (eventId) {
      queryBuilder.andWhere('booking.eventId = :eventId', { eventId });
    }

    // Customer filter
    if (customer) {
      queryBuilder.andWhere(
        '(booking.customerName ILIKE :customer OR booking.customerEmail ILIKE :customer)',
        { customer: `%${customer}%` }
      );
    }

    // Sorting
    if (sortBy) {
      queryBuilder.orderBy(`booking.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('booking.createdAt', 'DESC');
    }

    // Pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [bookings, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(bookings, total, page, limit);
  }

  async findById(id: string, organizationId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id, organizationId },
      relations: [
        'event',
        'inventoryAllocations',
        'inventoryAllocations.inventoryItem',
        'expenses',
        'revenues',
      ],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
    organizationId: string
  ): Promise<Booking> {
    const booking = await this.findById(id, organizationId);

    // Don't allow updates to completed or cancelled bookings
    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot update completed or cancelled bookings');
    }

    // Check if critical fields that require recalculation are being updated
    const needsRecalculation =
      updateBookingDto.eventId !== undefined ||
      updateBookingDto.durationType !== undefined ||
      updateBookingDto.durationHours !== undefined ||
      updateBookingDto.halfDaySlot !== undefined ||
      updateBookingDto.startDate !== undefined ||
      updateBookingDto.endDate !== undefined;

    if (needsRecalculation) {
      // Get the event for pricing calculations
      const eventId = updateBookingDto.eventId || booking.eventId;
      const event = await this.eventsService.findById(eventId, organizationId);

      // Parse dates if provided
      let startDate: Date;
      let endDate: Date;
      let halfDaySlot: 'morning' | 'evening' | undefined;

      if (updateBookingDto.startDate && updateBookingDto.endDate) {
        startDate = new Date(updateBookingDto.startDate);
        endDate = new Date(updateBookingDto.endDate);
      } else {
        // Use existing dates if not provided
        startDate = booking.startDate;
        endDate = booking.endDate;
      }

      // Determine duration type and slot
      const durationType = updateBookingDto.durationType || booking.durationType;

      if (durationType === 'half_day') {
        halfDaySlot = updateBookingDto.halfDaySlot || booking.halfDaySlot;
        if (!halfDaySlot) {
          throw new BadRequestException('Half day slot is required for half day bookings');
        }
      }

      // Calculate pricing based on duration type
      let totalAmount = 0;
      const durationHours = updateBookingDto.durationHours || booking.durationHours;

      if (durationType === 'hourly') {
        if (!durationHours || durationHours <= 0) {
          throw new BadRequestException('Duration hours is required for hourly bookings');
        }
        totalAmount = Number(event.hourlyPrice || 0) * Number(durationHours);
      } else if (durationType === 'half_day') {
        totalAmount = Number(event.halfDayPrice || 0);
      } else if (durationType === 'full_day') {
        totalAmount = Number(event.fullDayPrice || 0);
      }

      // Calculate advance amount
      let advanceAmount: number;
      if (updateBookingDto.useCustomAdvance && updateBookingDto.advanceAmount !== undefined) {
        advanceAmount = Number(updateBookingDto.advanceAmount);
      } else {
        // Use event's required advance percentage
        advanceAmount = (totalAmount * Number(event.requiredAdvancePercentage || 0)) / 100;
      }

      const balanceAmount = totalAmount - advanceAmount;

      // Calculate due dates
      const advanceDueDate = new Date();
      const balanceDueDate = new Date(startDate);
      balanceDueDate.setDate(
        balanceDueDate.getDate() - Number(event.balancePaymentWindowDays || 7)
      );

      // Update all calculated fields
      Object.assign(booking, {
        ...updateBookingDto,
        startDate,
        endDate,
        halfDaySlot,
        totalAmount: totalAmount.toFixed(2),
        advanceAmount: advanceAmount.toFixed(2),
        balanceAmount: balanceAmount.toFixed(2),
        advanceDueDate,
        balanceDueDate,
      });
    } else {
      // Simple update for non-critical fields
      Object.assign(booking, updateBookingDto);
    }

    const updatedBooking = await this.bookingRepository.save(booking);

    // Send update notification email to customer
    if (needsRecalculation || updateBookingDto.customerEmail || updateBookingDto.customerName) {
      try {
        const event = await this.eventsService.findById(updatedBooking.eventId, organizationId);
        await this.sendBookingUpdateEmail(updatedBooking, event);
      } catch (emailError) {
        // Log email error but don't fail the booking update
        console.error('Failed to send booking update email:', emailError);
      }
    }

    return updatedBooking;
  }

  async cancel(id: string, organizationId: string, reason?: string): Promise<Booking> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const booking = await this.findById(id, organizationId);

      if (!booking.canBeCancelled()) {
        throw new BadRequestException('Booking cannot be cancelled');
      }

      // Deallocate inventory
      for (const allocation of booking.inventoryAllocations) {
        await this.inventoryService.deallocateQuantity(
          allocation.inventoryItemId,
          allocation.quantity,
          organizationId
        );
      }

      // Update booking status
      booking.status = BookingStatus.CANCELLED;
      booking.paymentStatus = BookingPaymentStatus.REFUNDED;
      if (reason) {
        booking.notes = booking.notes
          ? `${booking.notes}\nCancellation reason: ${reason}`
          : `Cancellation reason: ${reason}`;
      }

      const updatedBooking = await queryRunner.manager.save(booking);

      await queryRunner.commitTransaction();
      return updatedBooking;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async confirm(id: string, organizationId: string): Promise<Booking> {
    const booking = await this.findById(id, organizationId);

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be confirmed');
    }

    booking.status = BookingStatus.CONFIRMED;
    return this.bookingRepository.save(booking);
  }

  async start(id: string, organizationId: string): Promise<Booking> {
    const booking = await this.findById(id, organizationId);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed bookings can be started');
    }

    booking.status = BookingStatus.STARTED;
    return this.bookingRepository.save(booking);
  }

  async complete(id: string, organizationId: string): Promise<Booking> {
    const booking = await this.findById(id, organizationId);

    if (booking.status !== BookingStatus.STARTED) {
      throw new BadRequestException('Only started bookings can be completed');
    }

    booking.status = BookingStatus.COMPLETED;
    return this.bookingRepository.save(booking);
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: BookingPaymentStatus,
    organizationId: string
  ): Promise<Booking> {
    const booking = await this.findById(id, organizationId);
    booking.paymentStatus = paymentStatus;
    return this.bookingRepository.save(booking);
  }

  async addExpense(
    id: string,
    addExpenseDto: AddExpenseDto,
    organizationId: string
  ): Promise<Booking> {
    const booking = await this.findById(id, organizationId);

    const expense = this.expenseRepository.create({
      ...addExpenseDto,
      bookingId: id,
    });

    await this.expenseRepository.save(expense);
    return this.findById(id, organizationId);
  }

  async addRevenue(
    id: string,
    addRevenueDto: AddRevenueDto,
    organizationId: string
  ): Promise<Booking> {
    const booking = await this.findById(id, organizationId);

    const revenue = this.revenueRepository.create({
      ...addRevenueDto,
      bookingId: id,
    });

    await this.revenueRepository.save(revenue);
    return this.findById(id, organizationId);
  }

  async removeExpense(bookingId: string, expenseId: string): Promise<void> {
    const expense = await this.expenseRepository.findOne({
      where: { id: expenseId, bookingId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    await this.expenseRepository.remove(expense);
  }

  async removeRevenue(bookingId: string, revenueId: string): Promise<void> {
    const revenue = await this.revenueRepository.findOne({
      where: { id: revenueId, bookingId },
    });

    if (!revenue) {
      throw new NotFoundException('Revenue not found');
    }

    await this.revenueRepository.remove(revenue);
  }

  async getBookingsByEvent(
    eventId: string,
    paginationDto: PaginationDto
  ): Promise<PaginatedResponseDto<Booking>> {
    const { page, limit, sortBy, sortOrder } = paginationDto;

    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.inventoryAllocations', 'allocations')
      .leftJoinAndSelect('allocations.inventoryItem', 'item')
      .where('booking.eventId = :eventId', { eventId });

    // Sorting
    if (sortBy) {
      queryBuilder.orderBy(`booking.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('booking.createdAt', 'DESC');
    }

    // Pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [bookings, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(bookings, total, page, limit);
  }

  async getOverdueBookings(): Promise<Booking[]> {
    const now = new Date();

    return this.bookingRepository.find({
      where: [
        {
          paymentStatus: BookingPaymentStatus.PENDING,
          advanceDueDate: LessThan(now),
        },
        {
          paymentStatus: BookingPaymentStatus.ADVANCE_PAID,
          balanceDueDate: LessThan(now),
        },
      ],
      relations: ['event'],
    });
  }
}
