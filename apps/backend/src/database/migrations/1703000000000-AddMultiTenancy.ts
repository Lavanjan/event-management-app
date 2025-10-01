import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMultiTenancy1703000000000 implements MigrationInterface {
  name = 'AddMultiTenancy1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create organization status enum if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."organizations_status_enum" AS ENUM('active', 'suspended', 'inactive');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create organizations table
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" character varying,
        "website" character varying,
        "phone" character varying,
        "email" character varying,
        "address" text,
        "city" character varying,
        "state" character varying,
        "postal_code" character varying,
        "country" character varying,
        "status" "public"."organizations_status_enum" NOT NULL DEFAULT 'active',
        "settings" jsonb,
        "metadata" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id")
      )
    `);

    // Create additional enum types
    await queryRunner.query(`
      CREATE TYPE "public"."users_user_type_enum" AS ENUM('product_admin', 'organization_admin', 'organization_user')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."roles_scope_enum" AS ENUM('global', 'organization')
    `);

    // Create unique indexes for organizations
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_organizations_slug" ON "organizations" ("slug")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_organizations_status" ON "organizations" ("status")
    `);

    // Add organization_id and user_type to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "user_type" "public"."users_user_type_enum" NOT NULL DEFAULT 'organization_user',
      ADD COLUMN "organization_id" uuid
    `);

    // Add foreign key constraint for users.organization_id
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "FK_users_organization_id" 
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    // Create indexes for users
    await queryRunner.query(`
      CREATE INDEX "IDX_users_organization_id" ON "users" ("organization_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_user_type" ON "users" ("user_type")
    `);

    // Add organization_id and scope to roles table
    await queryRunner.query(`
      ALTER TABLE "roles" 
      ADD COLUMN "scope" "public"."roles_scope_enum" NOT NULL DEFAULT 'organization',
      ADD COLUMN "organization_id" uuid
    `);

    // Drop the old unique constraint on roles.name
    await queryRunner.query(`
      ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "UQ_roles_name"
    `);

    // Add new unique constraint for roles (name + organization_id)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_roles_name_organization_id" ON "roles" ("name", "organization_id")
    `);

    // Add foreign key constraint for roles.organization_id
    await queryRunner.query(`
      ALTER TABLE "roles" 
      ADD CONSTRAINT "FK_roles_organization_id" 
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    // Create indexes for roles
    await queryRunner.query(`
      CREATE INDEX "IDX_roles_organization_id" ON "roles" ("organization_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_roles_scope" ON "roles" ("scope")
    `);

    // Add organization_id to events table
    await queryRunner.query(`
      ALTER TABLE "events" 
      ADD COLUMN "organization_id" uuid NOT NULL
    `);

    // Add foreign key constraint for events.organization_id
    await queryRunner.query(`
      ALTER TABLE "events" 
      ADD CONSTRAINT "FK_events_organization_id" 
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    // Create indexes for events
    await queryRunner.query(`
      CREATE INDEX "IDX_events_organization_id" ON "events" ("organization_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_events_start_date" ON "events" ("start_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_events_is_active" ON "events" ("is_active")
    `);

    // Add organization_id to inventory_items table
    await queryRunner.query(`
      ALTER TABLE "inventory_items" 
      ADD COLUMN "organization_id" uuid NOT NULL
    `);

    // Add foreign key constraint for inventory_items.organization_id
    await queryRunner.query(`
      ALTER TABLE "inventory_items" 
      ADD CONSTRAINT "FK_inventory_items_organization_id" 
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    // Create indexes for inventory_items
    await queryRunner.query(`
      CREATE INDEX "IDX_inventory_items_organization_id" ON "inventory_items" ("organization_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_inventory_items_is_active" ON "inventory_items" ("is_active")
    `);

    // Add organization_id to bookings table
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ADD COLUMN "organization_id" uuid NOT NULL
    `);

    // Add foreign key constraint for bookings.organization_id
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ADD CONSTRAINT "FK_bookings_organization_id" 
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    // Create indexes for bookings
    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_organization_id" ON "bookings" ("organization_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_event_id" ON "bookings" ("event_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_status" ON "bookings" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_payment_status" ON "bookings" ("payment_status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_payment_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_event_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_organization_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_items_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_items_organization_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_events_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_events_start_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_events_organization_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_roles_scope"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_roles_organization_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_roles_name_organization_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_user_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_organization_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_organizations_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_organizations_slug"`);

    // Remove foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "FK_bookings_organization_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_items" DROP CONSTRAINT IF EXISTS "FK_inventory_items_organization_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "FK_events_organization_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "FK_roles_organization_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_organization_id"`
    );

    // Remove columns
    await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN IF EXISTS "organization_id"`);
    await queryRunner.query(
      `ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "organization_id"`
    );
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN IF EXISTS "organization_id"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN IF EXISTS "organization_id"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN IF EXISTS "scope"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "organization_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "user_type"`);

    // Restore original unique constraint for roles
    await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "UQ_roles_name" UNIQUE ("name")`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."roles_scope_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_user_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."organizations_status_enum"`);

    // Drop organizations table
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations"`);
  }
}
