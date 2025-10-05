import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment, PaymentStatus, PaymentType, PaymentMethod } from '../../database/entities/payment.entity';
import { PaymentTransaction, TransactionType } from '../../database/entities/payment-transaction.entity';
import { Booking } from '../../database/entities/booking.entity';
import { User } from '../../database/entities/user.entity';

export interface CreatePaymentDto {
  bookingId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  currency?: string;
  description?: string;
  notes?: string;
  dueDate?: Date;
  paymentDetails?: any;
  gatewayData?: any;
}

export interface UpdatePaymentDto {
  status?: PaymentStatus;
  transactionId?: string;
  externalPaymentId?: string;
  gatewayResponse?: string;
  notes?: string;
  processedAt?: Date;
  gatewayData?: any;
}

export interface ProcessRefundDto {
  amount: number;
  reason: string;
  notes?: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentType?: PaymentType;
  bookingId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentTransaction)
    private transactionRepository: Repository<PaymentTransaction>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    private dataSource: DataSource,
  ) {}

  async create(createPaymentDto: CreatePaymentDto, organizationId: string, userId: string): Promise<Payment> {
    // Verify booking exists and belongs to organization
    const booking = await this.bookingRepository.findOne({
      where: { id: createPaymentDto.bookingId, organizationId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const payment = new Payment();
    payment.organizationId = organizationId;
    payment.bookingId = createPaymentDto.bookingId;
    payment.paymentMethod = createPaymentDto.paymentMethod;
    payment.amount = createPaymentDto.amount;
    payment.netAmount = createPaymentDto.amount; // Will be updated when fees are calculated
    payment.currency = createPaymentDto.currency || 'USD';
    payment.description = createPaymentDto.description;
    payment.notes = createPaymentDto.notes;
    payment.dueDate = createPaymentDto.dueDate;
    payment.paymentDetails = createPaymentDto.paymentDetails;
    payment.gatewayData = createPaymentDto.gatewayData;
    payment.processedBy = userId;

    return await this.dataSource.transaction(async manager => {
      const savedPayment = await manager.save(Payment, payment);

      // Create transaction log
      const transaction = new PaymentTransaction();
      transaction.organizationId = organizationId;
      transaction.paymentId = savedPayment.id;
      transaction.transactionType = TransactionType.PAYMENT_CREATED;
      transaction.newStatus = PaymentStatus.PENDING;
      transaction.description = 'Payment created';
      transaction.userId = userId;

      await manager.save(PaymentTransaction, transaction);

      return savedPayment;
    });
  }

  async findAll(organizationId: string, filters: PaymentFilters = {}) {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.booking', 'booking')
      .leftJoinAndSelect('payment.processor', 'processor')
      .where('payment.organizationId = :organizationId', { organizationId })
      .andWhere('payment.deletedAt IS NULL');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('payment.status = :status', { status: filters.status });
    }

    if (filters.paymentMethod) {
      queryBuilder.andWhere('payment.paymentMethod = :paymentMethod', { paymentMethod: filters.paymentMethod });
    }

    if (filters.paymentType) {
      queryBuilder.andWhere('payment.paymentType = :paymentType', { paymentType: filters.paymentType });
    }

    if (filters.bookingId) {
      queryBuilder.andWhere('payment.bookingId = :bookingId', { bookingId: filters.bookingId });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('payment.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('payment.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(payment.transactionId ILIKE :search OR payment.referenceNumber ILIKE :search OR payment.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    queryBuilder.orderBy('payment.createdAt', 'DESC');
    queryBuilder.skip(offset).take(limit);

    const [payments, total] = await queryBuilder.getManyAndCount();

    return {
      data: payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, organizationId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, organizationId, deletedAt: null },
      relations: ['booking', 'processor', 'parentPayment'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto, organizationId: string, userId: string): Promise<Payment> {
    const payment = await this.findOne(id, organizationId);
    const previousStatus = payment.status;

    Object.assign(payment, updatePaymentDto);

    return await this.dataSource.transaction(async manager => {
      const updatedPayment = await manager.save(Payment, payment);

      // Create transaction log if status changed
      if (updatePaymentDto.status && updatePaymentDto.status !== previousStatus) {
        const transaction = new PaymentTransaction();
        transaction.organizationId = organizationId;
        transaction.paymentId = payment.id;
        transaction.transactionType = TransactionType.STATUS_CHANGED;
        transaction.previousStatus = previousStatus;
        transaction.newStatus = updatePaymentDto.status;
        transaction.description = `Payment status changed from ${previousStatus} to ${updatePaymentDto.status}`;
        transaction.userId = userId;

        await manager.save(PaymentTransaction, transaction);
      }

      return updatedPayment;
    });
  }

  async processRefund(id: string, refundDto: ProcessRefundDto, organizationId: string, userId: string): Promise<Payment> {
    const originalPayment = await this.findOne(id, organizationId);

    if (originalPayment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    if (refundDto.amount > originalPayment.amount) {
      throw new BadRequestException('Refund amount cannot exceed original payment amount');
    }

    const refundPayment = new Payment();
    refundPayment.organizationId = organizationId;
    refundPayment.bookingId = originalPayment.bookingId;
    refundPayment.paymentType = refundDto.amount === originalPayment.amount ? PaymentType.REFUND : PaymentType.PARTIAL_REFUND;
    refundPayment.paymentMethod = originalPayment.paymentMethod;
    refundPayment.amount = refundDto.amount;
    refundPayment.netAmount = refundDto.amount;
    refundPayment.currency = originalPayment.currency;
    refundPayment.description = `Refund for payment ${originalPayment.id}`;
    refundPayment.notes = refundDto.notes;
    refundPayment.parentPaymentId = originalPayment.id;
    refundPayment.processedBy = userId;
    refundPayment.status = PaymentStatus.COMPLETED;
    refundPayment.processedAt = new Date();

    return await this.dataSource.transaction(async manager => {
      const savedRefund = await manager.save(Payment, refundPayment);

      // Update original payment status
      if (refundDto.amount === originalPayment.amount) {
        originalPayment.status = PaymentStatus.REFUNDED;
      } else {
        originalPayment.status = PaymentStatus.PARTIALLY_REFUNDED;
      }
      await manager.save(Payment, originalPayment);

      // Create transaction logs
      const refundTransaction = new PaymentTransaction();
      refundTransaction.organizationId = organizationId;
      refundTransaction.paymentId = savedRefund.id;
      refundTransaction.transactionType = TransactionType.REFUND_COMPLETED;
      refundTransaction.newStatus = PaymentStatus.COMPLETED;
      refundTransaction.description = refundDto.reason;
      refundTransaction.userId = userId;

      await manager.save(PaymentTransaction, refundTransaction);

      return savedRefund;
    });
  }

  async getTransactionHistory(paymentId: string, organizationId: string): Promise<PaymentTransaction[]> {
    const payment = await this.findOne(paymentId, organizationId);

    return await this.transactionRepository.find({
      where: { paymentId: payment.id, organizationId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPaymentsByBooking(bookingId: string, organizationId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { bookingId, organizationId, deletedAt: null },
      relations: ['processor'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPaymentSummary(organizationId: string, filters: { dateFrom?: Date; dateTo?: Date } = {}) {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.organizationId = :organizationId', { organizationId })
      .andWhere('payment.deletedAt IS NULL');

    if (filters.dateFrom) {
      queryBuilder.andWhere('payment.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('payment.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    const [totalPayments, completedPayments, pendingPayments, failedPayments] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.clone().andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED }).getCount(),
      queryBuilder.clone().andWhere('payment.status IN (:...statuses)', {
        statuses: [PaymentStatus.PENDING, PaymentStatus.PROCESSING]
      }).getCount(),
      queryBuilder.clone().andWhere('payment.status IN (:...statuses)', {
        statuses: [PaymentStatus.FAILED, PaymentStatus.CANCELLED]
      }).getCount(),
    ]);

    const totalAmountResult = await queryBuilder
      .clone()
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    const refundAmountResult = await queryBuilder
      .clone()
      .andWhere('payment.paymentType IN (:...types)', { types: [PaymentType.REFUND, PaymentType.PARTIAL_REFUND] })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    return {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalAmount: parseFloat(totalAmountResult?.total || '0'),
      refundAmount: parseFloat(refundAmountResult?.total || '0'),
      netAmount: parseFloat(totalAmountResult?.total || '0') - parseFloat(refundAmountResult?.total || '0'),
    };
  }

  async delete(id: string, organizationId: string, userId: string): Promise<void> {
    const payment = await this.findOne(id, organizationId);

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete completed payments');
    }

    payment.deletedAt = new Date();
    await this.paymentRepository.save(payment);

    // Create transaction log
    const transaction = new PaymentTransaction();
    transaction.organizationId = organizationId;
    transaction.paymentId = payment.id;
    transaction.transactionType = TransactionType.PAYMENT_CANCELLED;
    transaction.previousStatus = payment.status;
    transaction.newStatus = PaymentStatus.CANCELLED;
    transaction.description = 'Payment deleted';
    transaction.userId = userId;

    await this.transactionRepository.save(transaction);
  }
}
