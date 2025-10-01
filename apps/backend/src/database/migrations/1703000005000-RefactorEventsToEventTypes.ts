import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorEventsToEventTypes1703000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new pricing columns to events table
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "hourly_price" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "half_day_price" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "full_day_price" DECIMAL(10,2)
    `);

    // Add constraints for pricing
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD CONSTRAINT "CHK_events_hourly_price" CHECK ("hourly_price" IS NULL OR "hourly_price" >= 0),
      ADD CONSTRAINT "CHK_events_half_day_price" CHECK ("half_day_price" IS NULL OR "half_day_price" >= 0),
      ADD CONSTRAINT "CHK_events_full_day_price" CHECK ("full_day_price" IS NULL OR "full_day_price" >= 0)
    `);

    // Add new columns to bookings table for date/time tracking
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN IF NOT EXISTS "start_date" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "end_date" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "duration_hours" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "duration_type" VARCHAR(20) DEFAULT 'hourly'
    `);

    // Add check constraint for duration_type
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "CHK_bookings_duration_type" 
      CHECK ("duration_type" IN ('hourly', 'half_day', 'full_day'))
    `);

    // Add check constraint for start_date < end_date
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "CHK_bookings_dates" 
      CHECK ("start_date" IS NULL OR "end_date" IS NULL OR "start_date" < "end_date")
    `);

    // Create indexes for booking dates
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_bookings_start_date" ON "bookings" ("start_date")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_bookings_end_date" ON "bookings" ("end_date")
    `);

    // Migrate existing data: Copy event dates to bookings
    await queryRunner.query(`
      UPDATE "bookings" b
      SET 
        "start_date" = e."start_date",
        "end_date" = e."end_date",
        "duration_type" = 'full_day',
        "duration_hours" = EXTRACT(EPOCH FROM (e."end_date" - e."start_date")) / 3600
      FROM "events" e
      WHERE b."event_id" = e."id"
      AND b."start_date" IS NULL
    `);

    // Make start_date and end_date NOT NULL in bookings after migration
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ALTER COLUMN "start_date" SET NOT NULL,
      ALTER COLUMN "end_date" SET NOT NULL
    `);

    // Drop the old check constraint on events table
    await queryRunner.query(`
      ALTER TABLE "events"
      DROP CONSTRAINT IF EXISTS "CHK_c8e5e0e8c8e5e0e8c8e5e0e8"
    `);

    // Make start_date and end_date nullable in events (they're now templates)
    await queryRunner.query(`
      ALTER TABLE "events"
      ALTER COLUMN "start_date" DROP NOT NULL,
      ALTER COLUMN "end_date" DROP NOT NULL
    `);

    // Drop indexes on events start_date since it's no longer used
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_events_start_date"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore events start_date index
    await queryRunner.query(`
      CREATE INDEX "IDX_events_start_date" ON "events" ("start_date")
    `);

    // Make start_date and end_date NOT NULL again in events
    await queryRunner.query(`
      ALTER TABLE "events"
      ALTER COLUMN "start_date" SET NOT NULL,
      ALTER COLUMN "end_date" SET NOT NULL
    `);

    // Drop booking date indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_bookings_start_date"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_bookings_end_date"
    `);

    // Drop booking constraints
    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP CONSTRAINT IF EXISTS "CHK_bookings_dates"
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP CONSTRAINT IF EXISTS "CHK_bookings_duration_type"
    `);

    // Drop booking columns
    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP COLUMN IF EXISTS "start_date",
      DROP COLUMN IF EXISTS "end_date",
      DROP COLUMN IF EXISTS "duration_hours",
      DROP COLUMN IF EXISTS "duration_type"
    `);

    // Drop event pricing constraints
    await queryRunner.query(`
      ALTER TABLE "events"
      DROP CONSTRAINT IF EXISTS "CHK_events_hourly_price",
      DROP CONSTRAINT IF EXISTS "CHK_events_half_day_price",
      DROP CONSTRAINT IF EXISTS "CHK_events_full_day_price"
    `);

    // Drop event pricing columns
    await queryRunner.query(`
      ALTER TABLE "events"
      DROP COLUMN IF EXISTS "hourly_price",
      DROP COLUMN IF EXISTS "half_day_price",
      DROP COLUMN IF EXISTS "full_day_price"
    `);
  }
}

