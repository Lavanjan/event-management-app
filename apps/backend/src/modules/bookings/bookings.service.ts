import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';

import { Booking, BookingStatus, PaymentStatus } from '../../database/entities/booking.entity';
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
import { InventoryService } from '../inventory/inventory.service';
import { EventsService } from '../events/events.service';

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
    private dataSource: DataSource
  ) {}

  async create(createBookingDto: CreateBookingDto, organizationId: string): Promise<Booking> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate event exists and can accept bookings within the organization
      const event = await this.eventsService.findById(createBookingDto.eventId, organizationId);

      if (!event.canAcceptBooking()) {
        throw new BadRequestException('Event cannot accept new bookings');
      }

      // Calculate inventory total
      let inventoryTotal = 0;
      const allocations: BookingInventoryAllocation[] = [];

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

      // Calculate total amount
      const totalAmount = inventoryTotal;
      const advanceAmount = (totalAmount * event.requiredAdvancePercentage) / 100;
      const balanceAmount = totalAmount - advanceAmount;

      // Create booking
      const booking = this.bookingRepository.create({
        ...createBookingDto,
        organizationId,
        totalAmount,
        advanceAmount,
        balanceAmount,
        advanceDueDate: event.calculateAdvanceDueDate(),
        balanceDueDate: event.calculateBalanceDueDate(),
        inventoryAllocations: allocations,
      });

      // Add expenses if provided
      if (createBookingDto.expenses) {
        booking.expenses = createBookingDto.expenses.map(expense =>
          this.expenseRepository.create(expense)
        );
      }

      // Add revenues if provided
      if (createBookingDto.revenues) {
        booking.revenues = createBookingDto.revenues.map(revenue =>
          this.revenueRepository.create(revenue)
        );
      }

      const savedBooking = await queryRunner.manager.save(booking);

      await queryRunner.commitTransaction();
      return this.findById(savedBooking.id, organizationId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    organizationId: string
  ): Promise<PaginatedResponseDto<Booking>> {
    const { page, limit, search, sortBy, sortOrder } = paginationDto;

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

    // Update fields
    Object.assign(booking, updateBookingDto);

    return this.bookingRepository.save(booking);
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
      booking.paymentStatus = PaymentStatus.REFUNDED;
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

  async complete(id: string, organizationId: string): Promise<Booking> {
    const booking = await this.findById(id, organizationId);

    if (!booking.canBeCompleted()) {
      throw new BadRequestException('Booking cannot be completed');
    }

    booking.status = BookingStatus.COMPLETED;
    return this.bookingRepository.save(booking);
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
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
          paymentStatus: PaymentStatus.PENDING,
          advanceDueDate: LessThan(now),
        },
        {
          paymentStatus: PaymentStatus.ADVANCE_PAID,
          balanceDueDate: LessThan(now),
        },
      ],
      relations: ['event'],
    });
  }
}
