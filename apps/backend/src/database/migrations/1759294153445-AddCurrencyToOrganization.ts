import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCurrencyToOrganization1759294153445 implements MigrationInterface {
    name = 'AddCurrencyToOrganization1759294153445'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_permissions" DROP CONSTRAINT "FK_organization_permissions_organization"`);
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP CONSTRAINT "FK_inventory_items_category_id"`);
        await queryRunner.query(`ALTER TABLE "inventory_categories" DROP CONSTRAINT "FK_inventory_categories_organization_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_verification_token"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_verification_otp"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_is_verified"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_requires_verification"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_organization_permissions_organization_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_organization_permissions_permission_key"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_organization_permissions_unique"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ce5225c17497c5adddc1819c69"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bookings_start_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bookings_end_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_inventory_categories_organization_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_inventory_categories_is_active"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "CHK_6b09fee261a0814d58741f6de5"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "CHK_events_hourly_price"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "CHK_events_half_day_price"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "CHK_events_full_day_price"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "CHK_bookings_duration_type"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "CHK_bookings_dates"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "CHK_half_day_slot"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "bookings_no_overlap_excl"`);
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "currency" character varying(3) NOT NULL DEFAULT 'USD'`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "duration_type" SET NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."bookings_status_enum" RENAME TO "bookings_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."bookings_status_enum" AS ENUM('pending', 'confirmed', 'started', 'cancelled', 'completed')`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "public"."bookings_status_enum" USING "status"::"text"::"public"."bookings_status_enum"`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."bookings_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "inventory_categories" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "inventory_categories" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "IDX_8a970b1dbbf3fb79b9d0152b68" ON "bookings" ("end_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_dcee9978df46cc64caf06c8ce3" ON "bookings" ("start_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_681f5cf594aba76bdc6c35353d" ON "inventory_categories" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_c3bc041aa23787e6666bda0e2b" ON "inventory_categories" ("organization_id") `);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "CHK_0046ccd73b2d1a1abadf182a9e" CHECK ("full_day_price" IS NULL OR "full_day_price" >= 0)`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "CHK_5fe14de509f3e6c692c99039c2" CHECK ("half_day_price" IS NULL OR "half_day_price" >= 0)`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "CHK_75bf04351a03f9ddba5280e4d1" CHECK ("hourly_price" IS NULL OR "hourly_price" >= 0)`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "CHK_e35aaaabe9853c5b8d5263cb35" CHECK ("status" IN ('pending', 'confirmed', 'started', 'cancelled', 'completed'))`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "CHK_22b29b961558a9b4a5ff4095e0" CHECK ("duration_type" IN ('hourly', 'half_day', 'full_day'))`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "CHK_a94be55856e9b9d15513499a6c" CHECK ("start_date" < "end_date")`);
        await queryRunner.query(`ALTER TABLE "inventory_categories" ADD CONSTRAINT "FK_c3bc041aa23787e6666bda0e2b4" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_categories" DROP CONSTRAINT "FK_c3bc041aa23787e6666bda0e2b4"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "CHK_a94be55856e9b9d15513499a6c"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "CHK_22b29b961558a9b4a5ff4095e0"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "CHK_e35aaaabe9853c5b8d5263cb35"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "CHK_75bf04351a03f9ddba5280e4d1"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "CHK_5fe14de509f3e6c692c99039c2"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "CHK_0046ccd73b2d1a1abadf182a9e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c3bc041aa23787e6666bda0e2b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_681f5cf594aba76bdc6c35353d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dcee9978df46cc64caf06c8ce3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8a970b1dbbf3fb79b9d0152b68"`);
        await queryRunner.query(`ALTER TABLE "inventory_categories" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "inventory_categories" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`CREATE TYPE "public"."bookings_status_enum_old" AS ENUM('pending', 'confirmed', 'cancelled', 'completed')`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "public"."bookings_status_enum_old" USING "status"::"text"::"public"."bookings_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."bookings_status_enum_old" RENAME TO "bookings_status_enum"`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "duration_type" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD "category" character varying`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap_excl" EXCLUDE USING gist (event_id WITH =, organization_id WITH =, tsrange(start_date, end_date) WITH &&) WHERE ((status <> 'cancelled'::bookings_status_enum))`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "CHK_half_day_slot" CHECK (((half_day_slot IS NULL) OR ((half_day_slot)::text = ANY ((ARRAY['morning'::character varying, 'evening'::character varying])::text[]))))`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "CHK_bookings_dates" CHECK (((start_date IS NULL) OR (end_date IS NULL) OR (start_date < end_date)))`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "CHK_bookings_duration_type" CHECK (((duration_type)::text = ANY ((ARRAY['hourly'::character varying, 'half_day'::character varying, 'full_day'::character varying])::text[])))`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "CHK_events_full_day_price" CHECK (((full_day_price IS NULL) OR (full_day_price >= (0)::numeric)))`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "CHK_events_half_day_price" CHECK (((half_day_price IS NULL) OR (half_day_price >= (0)::numeric)))`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "CHK_events_hourly_price" CHECK (((hourly_price IS NULL) OR (hourly_price >= (0)::numeric)))`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "CHK_6b09fee261a0814d58741f6de5" CHECK ((start_date < end_date))`);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_categories_is_active" ON "inventory_categories" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_categories_organization_id" ON "inventory_categories" ("organization_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bookings_end_date" ON "bookings" ("end_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_bookings_start_date" ON "bookings" ("start_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_ce5225c17497c5adddc1819c69" ON "events" ("start_date") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_organization_permissions_unique" ON "organization_permissions" ("organization_id", "permission_key") `);
        await queryRunner.query(`CREATE INDEX "IDX_organization_permissions_permission_key" ON "organization_permissions" ("permission_key") `);
        await queryRunner.query(`CREATE INDEX "IDX_organization_permissions_organization_id" ON "organization_permissions" ("organization_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_requires_verification" ON "users" ("requires_verification") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_is_verified" ON "users" ("is_verified") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_verification_otp" ON "users" ("verification_otp") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_verification_token" ON "users" ("verification_token") `);
        await queryRunner.query(`ALTER TABLE "inventory_categories" ADD CONSTRAINT "FK_inventory_categories_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD CONSTRAINT "FK_inventory_items_category_id" FOREIGN KEY ("category_id") REFERENCES "inventory_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_permissions" ADD CONSTRAINT "FK_organization_permissions_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
