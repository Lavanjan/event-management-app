import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePaymentPlans1696000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment_plans table
    await queryRunner.createTable(
      new Table({
        name: 'payment_plans',
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
            name: 'plan_type',
            type: 'enum',
            enum: ['installments', 'subscription', 'deferred'],
            default: "'installments'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'completed', 'cancelled', 'defaulted', 'suspended'],
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'total_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'paid_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'remaining_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'installment_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'installment_count',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'completed_installments',
            type: 'integer',
            default: 0,
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
            name: 'start_date',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'next_payment_date',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'payment_frequency',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'late_fee_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'late_fee_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'grace_period_days',
            type: 'integer',
            default: 0,
            isNullable: false,
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
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_by',
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
            name: 'CHK_payment_plans_total_amount_positive',
            expression: 'total_amount > 0',
          },
          {
            name: 'CHK_payment_plans_installment_amount_positive',
            expression: 'installment_amount > 0',
          },
          {
            name: 'CHK_payment_plans_installment_count_positive',
            expression: 'installment_count > 0',
          },
        ],
      }),
      true,
    );

    // Create indexes for payment_plans
    await queryRunner.createIndex('payment_plans', new TableIndex({
      name: 'IDX_payment_plans_organization_id',
      columnNames: ['organization_id'],
    }));
    await queryRunner.createIndex('payment_plans', new TableIndex({
      name: 'IDX_payment_plans_booking_id',
      columnNames: ['booking_id'],
    }));
    await queryRunner.createIndex('payment_plans', new TableIndex({
      name: 'IDX_payment_plans_status',
      columnNames: ['status'],
    }));
    await queryRunner.createIndex('payment_plans', new TableIndex({
      name: 'IDX_payment_plans_next_payment_date',
      columnNames: ['next_payment_date'],
    }));
    await queryRunner.createIndex('payment_plans', new TableIndex({
      name: 'IDX_payment_plans_created_at',
      columnNames: ['created_at'],
    }));

    // Create foreign keys for payment_plans
    await queryRunner.createForeignKey(
      'payment_plans',
      new TableForeignKey({
        columnNames: ['booking_id'],
        referencedTableName: 'bookings',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payment_plans',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payment_plans');
  }
}
