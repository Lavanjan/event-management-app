import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePaymentEntities1696000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payments table
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'booking_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'payment_type',
            type: 'enum',
            enum: ['payment', 'refund', 'partial_refund', 'chargeback'],
            default: "'payment'",
            isNullable: false,
          },
          {
            name: 'payment_method',
            type: 'enum',
            enum: ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'check', 'paypal', 'stripe', 'square', 'other'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'fee_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'net_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'USD'",
            isNullable: false,
          },
          {
            name: 'transaction_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'external_payment_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'gateway_response',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reference_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'gateway_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'payment_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'processed_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'processed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'due_date',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'parent_payment_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
        checks: [
          {
            name: 'CHK_payments_amount_positive',
            expression: 'amount > 0',
          },
        ],
      }),
      true,
    );

    // Create indexes for payments
    await queryRunner.createIndex('payments', new TableIndex({
      name: 'IDX_payments_organization_id',
      columnNames: ['organization_id'],
    }));
    await queryRunner.createIndex('payments', new TableIndex({
      name: 'IDX_payments_booking_id',
      columnNames: ['booking_id'],
    }));
    await queryRunner.createIndex('payments', new TableIndex({
      name: 'IDX_payments_status',
      columnNames: ['status'],
    }));
    await queryRunner.createIndex('payments', new TableIndex({
      name: 'IDX_payments_payment_method',
      columnNames: ['payment_method'],
    }));
    await queryRunner.createIndex('payments', new TableIndex({
      name: 'IDX_payments_payment_type',
      columnNames: ['payment_type'],
    }));
    await queryRunner.createIndex('payments', new TableIndex({
      name: 'IDX_payments_created_at',
      columnNames: ['created_at'],
    }));
    await queryRunner.createIndex('payments', new TableIndex({
      name: 'IDX_payments_transaction_id',
      columnNames: ['transaction_id'],
    }));

    // Create foreign keys for payments
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['booking_id'],
        referencedTableName: 'bookings',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['processed_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['parent_payment_id'],
        referencedTableName: 'payments',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payments');
  }
}
