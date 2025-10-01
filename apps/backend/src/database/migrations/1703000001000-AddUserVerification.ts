import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserVerification1703000001000 implements MigrationInterface {
  name = 'AddUserVerification1703000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns already exist before adding them
    const existingColumns = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users'
    `);

    const columnNames = existingColumns.map((col: any) => col.column_name);

    // Add verification fields to users table only if they don't exist
    if (!columnNames.includes('is_verified')) {
      await queryRunner.query(`
        ALTER TABLE "users"
        ADD COLUMN "is_verified" boolean NOT NULL DEFAULT false
      `);
    }

    if (!columnNames.includes('verification_token')) {
      await queryRunner.query(`
        ALTER TABLE "users"
        ADD COLUMN "verification_token" varchar
      `);
    }

    if (!columnNames.includes('verification_otp')) {
      await queryRunner.query(`
        ALTER TABLE "users"
        ADD COLUMN "verification_otp" varchar
      `);
    }

    if (!columnNames.includes('verification_otp_expires')) {
      await queryRunner.query(`
        ALTER TABLE "users"
        ADD COLUMN "verification_otp_expires" TIMESTAMP
      `);
    }

    if (!columnNames.includes('requires_verification')) {
      await queryRunner.query(`
        ALTER TABLE "users"
        ADD COLUMN "requires_verification" boolean NOT NULL DEFAULT false
      `);
    }

    // Create indexes for performance (check if they exist first)
    const existingIndexes = await queryRunner.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'users'
    `);

    const indexNames = existingIndexes.map((idx: any) => idx.indexname);

    if (!indexNames.includes('IDX_users_verification_token')) {
      await queryRunner.query(`
        CREATE INDEX "IDX_users_verification_token" ON "users" ("verification_token")
      `);
    }

    if (!indexNames.includes('IDX_users_verification_otp')) {
      await queryRunner.query(`
        CREATE INDEX "IDX_users_verification_otp" ON "users" ("verification_otp")
      `);
    }

    if (!indexNames.includes('IDX_users_is_verified')) {
      await queryRunner.query(`
        CREATE INDEX "IDX_users_is_verified" ON "users" ("is_verified")
      `);
    }

    if (!indexNames.includes('IDX_users_requires_verification')) {
      await queryRunner.query(`
        CREATE INDEX "IDX_users_requires_verification" ON "users" ("requires_verification")
      `);
    }

    // Update existing users to be verified (backward compatibility)
    await queryRunner.query(`
      UPDATE "users"
      SET "is_verified" = true, "requires_verification" = false
      WHERE "is_active" = true AND "is_verified" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes safely
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_requires_verification"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_is_verified"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_verification_otp"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_verification_token"`);

    // Remove verification fields safely
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "requires_verification"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "verification_otp_expires"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "verification_otp"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "verification_token"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_verified"`);
  }
}
