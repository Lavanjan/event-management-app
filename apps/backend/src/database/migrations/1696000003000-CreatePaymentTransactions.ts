import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePaymentTransactions1696000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment_transactions table
    await queryRunner.createTable(
      new Table({
        name: 'payment_transactions',
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
            name: 'payment_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'transaction_type',
            type: 'enum',
            enum: [
              'payment_created',
              'payment_processing',
              'payment_completed',
              'payment_failed',
              'payment_cancelled',
              'refund_initiated',
              'refund_completed',
              'refund_failed',
              'chargeback_received',
              'dispute_opened',
              'dispute_resolved',
              'status_changed',
              'amount_adjusted',
              'gateway_webhook',
              'manual_update'
            ],
            isNullable: false,
          },
          {
            name: 'previous_status',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'new_status',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'amount_change',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'external_transaction_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'gateway_reference',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for payment_transactions
    await queryRunner.createIndex('payment_transactions', new TableIndex({
      name: 'IDX_payment_transactions_organization_id',
      columnNames: ['organization_id'],
    }));
    await queryRunner.createIndex('payment_transactions', new TableIndex({
      name: 'IDX_payment_transactions_payment_id',
      columnNames: ['payment_id'],
    }));
    await queryRunner.createIndex('payment_transactions', new TableIndex({
      name: 'IDX_payment_transactions_transaction_type',
      columnNames: ['transaction_type'],
    }));
    await queryRunner.createIndex('payment_transactions', new TableIndex({
      name: 'IDX_payment_transactions_created_at',
      columnNames: ['created_at'],
    }));
    await queryRunner.createIndex('payment_transactions', new TableIndex({
      name: 'IDX_payment_transactions_user_id',
      columnNames: ['user_id'],
    }));

    // Create foreign keys for payment_transactions
    await queryRunner.createForeignKey(
      'payment_transactions',
      new TableForeignKey({
        columnNames: ['payment_id'],
        referencedTableName: 'payments',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payment_transactions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payment_transactions');
  }
}
