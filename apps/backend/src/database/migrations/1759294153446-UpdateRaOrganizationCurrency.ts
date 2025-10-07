import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRaOrganizationCurrency1759294153446 implements MigrationInterface {
  name = 'UpdateRaOrganizationCurrency1759294153446';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update Ra organization currency to LKR
    await queryRunner.query(`
      UPDATE organizations 
      SET currency = 'LKR' 
      WHERE name = 'Ra' OR slug = 'ra'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert Ra organization currency back to USD
    await queryRunner.query(`
      UPDATE organizations 
      SET currency = 'USD' 
      WHERE name = 'Ra' OR slug = 'ra'
    `);
  }
}
