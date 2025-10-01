import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingOverlapPrevention1759226800000 implements MigrationInterface {
  name = 'AddBookingOverlapPrevention1759226800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add half_day_slot column
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ADD COLUMN "half_day_slot" VARCHAR(20) NULL
    `);

    // Add check constraint for half_day_slot values
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ADD CONSTRAINT "CHK_half_day_slot" 
      CHECK ("half_day_slot" IS NULL OR "half_day_slot" IN ('morning', 'evening'))
    `);

    // Enable btree_gist extension for exclusion constraints
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);

    // Create exclusion constraint to prevent overlapping bookings for the same event
    // This ensures no two bookings can overlap for the same event and organization
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ADD CONSTRAINT "bookings_no_overlap_excl" 
      EXCLUDE USING gist (
        "event_id" WITH =,
        "organization_id" WITH =,
        tsrange("start_date", "end_date") WITH &&
      )
      WHERE ("status" != 'cancelled')
    `);

    // Create index on start_date and end_date for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_date_range" 
      ON "bookings" USING gist (tsrange("start_date", "end_date"))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_date_range"`);

    // Drop exclusion constraint
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      DROP CONSTRAINT IF EXISTS "bookings_no_overlap_excl"
    `);

    // Drop check constraint
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      DROP CONSTRAINT IF EXISTS "CHK_half_day_slot"
    `);

    // Drop half_day_slot column
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      DROP COLUMN IF EXISTS "half_day_slot"
    `);
  }
}

