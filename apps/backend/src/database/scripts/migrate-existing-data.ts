import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'event_booking',
  synchronize: false,
  logging: true,
});

async function migrateExistingData() {
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Connected successfully!');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('Starting migration transaction...');
    await queryRunner.startTransaction();

    try {
      // Step 1: Create enum types if they don't exist
      console.log('Creating enum types...');
      
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "public"."organizations_status_enum" AS ENUM('active', 'suspended', 'inactive');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "public"."users_user_type_enum" AS ENUM('product_admin', 'organization_admin', 'organization_user');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "public"."roles_scope_enum" AS ENUM('global', 'organization');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Step 2: Create organizations table
      console.log('Creating organizations table...');
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "organizations" (
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

      // Step 3: Create unique index for organizations
      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "IDX_organizations_slug" ON "organizations" ("slug")
      `);

      // Step 4: Insert default organization
      console.log('Creating default organization...');
      const result = await queryRunner.query(`
        INSERT INTO "organizations" (
          "name", 
          "slug", 
          "description", 
          "status", 
          "is_active"
        ) VALUES (
          'Default Organization',
          'default-org',
          'Default organization for existing data migration',
          'active',
          true
        ) 
        ON CONFLICT ("slug") DO NOTHING
        RETURNING "id"
      `);

      let defaultOrgId: string;
      if (result.length > 0) {
        defaultOrgId = result[0].id;
        console.log('Created new default organization with ID:', defaultOrgId);
      } else {
        // Get existing default organization
        const existing = await queryRunner.query(`
          SELECT "id" FROM "organizations" WHERE "slug" = 'default-org' LIMIT 1
        `);
        defaultOrgId = existing[0].id;
        console.log('Using existing default organization with ID:', defaultOrgId);
      }

      // Step 5: Add organization_id columns to existing tables (nullable first)
      console.log('Adding organization_id columns...');

      // Add to users table
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "users" ADD COLUMN "organization_id" uuid;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END $$;
      `);

      // Add user_type to users table
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "users" ADD COLUMN "user_type" "public"."users_user_type_enum" NOT NULL DEFAULT 'organization_user';
        EXCEPTION
          WHEN duplicate_column THEN null;
        END $$;
      `);

      // Add to roles table
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "roles" ADD COLUMN "organization_id" uuid;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END $$;
      `);

      // Add scope to roles table
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "roles" ADD COLUMN "scope" "public"."roles_scope_enum" NOT NULL DEFAULT 'organization';
        EXCEPTION
          WHEN duplicate_column THEN null;
        END $$;
      `);

      // Add to events table
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "events" ADD COLUMN "organization_id" uuid;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END $$;
      `);

      // Add to inventory_items table
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "inventory_items" ADD COLUMN "organization_id" uuid;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END $$;
      `);

      // Add to bookings table
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "bookings" ADD COLUMN "organization_id" uuid;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END $$;
      `);

      // Step 6: Update all existing records to use the default organization
      console.log('Updating existing records with default organization...');
      
      await queryRunner.query(`UPDATE "users" SET "organization_id" = $1 WHERE "organization_id" IS NULL`, [defaultOrgId]);
      await queryRunner.query(`UPDATE "roles" SET "organization_id" = $1 WHERE "organization_id" IS NULL`, [defaultOrgId]);
      await queryRunner.query(`UPDATE "events" SET "organization_id" = $1 WHERE "organization_id" IS NULL`, [defaultOrgId]);
      await queryRunner.query(`UPDATE "inventory_items" SET "organization_id" = $1 WHERE "organization_id" IS NULL`, [defaultOrgId]);
      await queryRunner.query(`UPDATE "bookings" SET "organization_id" = $1 WHERE "organization_id" IS NULL`, [defaultOrgId]);

      // Step 7: Make organization_id NOT NULL for required tables
      console.log('Setting NOT NULL constraints...');
      await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "organization_id" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "inventory_items" ALTER COLUMN "organization_id" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "organization_id" SET NOT NULL`);

      // Step 8: Add foreign key constraints
      console.log('Adding foreign key constraints...');
      
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "users" ADD CONSTRAINT "FK_users_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "roles" ADD CONSTRAINT "FK_roles_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "events" ADD CONSTRAINT "FK_events_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "inventory_items" ADD CONSTRAINT "FK_inventory_items_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Step 9: Create indexes for performance
      console.log('Creating indexes...');
      
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_organization_id" ON "users" ("organization_id")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_roles_organization_id" ON "roles" ("organization_id")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_events_organization_id" ON "events" ("organization_id")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_inventory_items_organization_id" ON "inventory_items" ("organization_id")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_bookings_organization_id" ON "bookings" ("organization_id")`);

      await queryRunner.commitTransaction();
      console.log('✅ Migration completed successfully!');
      console.log('Default organization ID:', defaultOrgId);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// Run the migration
migrateExistingData();
