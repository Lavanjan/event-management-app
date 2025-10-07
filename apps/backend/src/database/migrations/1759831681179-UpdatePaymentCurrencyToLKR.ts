import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePaymentCurrencyToLKR1759831681179 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update existing payments to use LKR currency
    await queryRunner.query(`
      UPDATE payments 
      SET currency = 'LKR' 
      WHERE currency = 'USD'
    `);

    // Update the default value for the currency column
    await queryRunner.query(`
      ALTER TABLE payments 
      ALTER COLUMN currency SET DEFAULT 'LKR'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert payments back to USD
    await queryRunner.query(`
      UPDATE payments 
      SET currency = 'USD' 
      WHERE currency = 'LKR'
    `);

    // Revert the default value for the currency column
    await queryRunner.query(`
      ALTER TABLE payments 
      ALTER COLUMN currency SET DEFAULT 'USD'
    `);
  }
}
