import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUuidColumnTypes1696000006000 implements MigrationInterface {
  name = 'FixUuidColumnTypes1696000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fix UUID column types in users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ALTER COLUMN "organization_id" TYPE uuid USING "organization_id"::uuid
    `);

    // Fix UUID column types in roles table
    await queryRunner.query(`
      ALTER TABLE "roles" 
      ALTER COLUMN "organization_id" TYPE uuid USING "organization_id"::uuid
    `);

    // Fix UUID column types in role_permissions table
    await queryRunner.query(`
      ALTER TABLE "role_permissions" 
      ALTER COLUMN "organization_id" TYPE uuid USING "organization_id"::uuid,
      ALTER COLUMN "role_id" TYPE uuid USING "role_id"::uuid
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert UUID column types in role_permissions table
    await queryRunner.query(`
      ALTER TABLE "role_permissions" 
      ALTER COLUMN "organization_id" TYPE varchar,
      ALTER COLUMN "role_id" TYPE varchar
    `);

    // Revert UUID column types in roles table
    await queryRunner.query(`
      ALTER TABLE "roles" 
      ALTER COLUMN "organization_id" TYPE varchar
    `);

    // Revert UUID column types in users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ALTER COLUMN "organization_id" TYPE varchar
    `);
  }
}
