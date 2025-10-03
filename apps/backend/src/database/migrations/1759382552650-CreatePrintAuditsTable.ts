import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePrintAuditsTable1759382552650 implements MigrationInterface {
  name = 'CreatePrintAuditsTable1759382552650';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create print_type enum
    await queryRunner.query(`
      CREATE TYPE "print_type_enum" AS ENUM('BILL', 'RECEIPT', 'INVOICE', 'REPRINT')
    `);

    // Create print_status enum
    await queryRunner.query(`
      CREATE TYPE "print_status_enum" AS ENUM('SUCCESS', 'FAILED', 'PENDING')
    `);

    // Create print_audits table
    await queryRunner.query(`
      CREATE TABLE "print_audits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "booking_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "print_type" "print_type_enum" NOT NULL DEFAULT 'BILL',
        "print_status" "print_status_enum" NOT NULL DEFAULT 'PENDING',
        "receipt_number" character varying(50),
        "printer_name" character varying(255),
        "printer_interface" character varying(255),
        "print_data" jsonb,
        "error_message" text,
        "error_code" character varying(50),
        "error_details" jsonb,
        "retry_count" integer NOT NULL DEFAULT 0,
        "max_retries" integer NOT NULL DEFAULT 3,
        "is_reprint" boolean NOT NULL DEFAULT false,
        "original_print_id" uuid,
        "print_started_at" TIMESTAMP WITH TIME ZONE,
        "print_completed_at" TIMESTAMP WITH TIME ZONE,
        "print_duration_ms" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_print_audits" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_print_audits_booking_id" ON "print_audits" ("booking_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_print_audits_user_id" ON "print_audits" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_print_audits_organization_id" ON "print_audits" ("organization_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_print_audits_print_status" ON "print_audits" ("print_status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_print_audits_created_at" ON "print_audits" ("created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_print_audits_receipt_number" ON "print_audits" ("receipt_number")
    `);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "print_audits"
      ADD CONSTRAINT "FK_print_audits_booking_id"
      FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "print_audits"
      ADD CONSTRAINT "FK_print_audits_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "print_audits"
      ADD CONSTRAINT "FK_print_audits_organization_id"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "print_audits"
      ADD CONSTRAINT "FK_print_audits_original_print_id"
      FOREIGN KEY ("original_print_id") REFERENCES "print_audits"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "print_audits" DROP CONSTRAINT "FK_print_audits_original_print_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "print_audits" DROP CONSTRAINT "FK_print_audits_organization_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "print_audits" DROP CONSTRAINT "FK_print_audits_user_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "print_audits" DROP CONSTRAINT "FK_print_audits_booking_id"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_print_audits_receipt_number"`);
    await queryRunner.query(`DROP INDEX "IDX_print_audits_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_print_audits_print_status"`);
    await queryRunner.query(`DROP INDEX "IDX_print_audits_organization_id"`);
    await queryRunner.query(`DROP INDEX "IDX_print_audits_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_print_audits_booking_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "print_audits"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "print_status_enum"`);
    await queryRunner.query(`DROP TYPE "print_type_enum"`);
  }
}
