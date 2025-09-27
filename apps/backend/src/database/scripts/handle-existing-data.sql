-- Script to handle existing data migration for multi-tenancy
-- This script should be run before the main migration

-- Step 1: Create the organizations table first
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
  "status" character varying NOT NULL DEFAULT 'active',
  "settings" jsonb,
  "metadata" jsonb,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id")
);

-- Step 2: Create a default organization for existing data
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
) ON CONFLICT DO NOTHING;

-- Step 3: Get the default organization ID
DO $$
DECLARE
    default_org_id uuid;
BEGIN
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'default-org' LIMIT 1;
    
    -- Step 4: Add organization_id columns as nullable first
    
    -- Add to users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_id') THEN
        ALTER TABLE "users" ADD "organization_id" uuid;
    END IF;
    
    -- Add to roles table  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'organization_id') THEN
        ALTER TABLE "roles" ADD "organization_id" uuid;
    END IF;
    
    -- Add to events table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'organization_id') THEN
        ALTER TABLE "events" ADD "organization_id" uuid;
    END IF;
    
    -- Add to inventory_items table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'organization_id') THEN
        ALTER TABLE "inventory_items" ADD "organization_id" uuid;
    END IF;
    
    -- Add to bookings table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'organization_id') THEN
        ALTER TABLE "bookings" ADD "organization_id" uuid;
    END IF;
    
    -- Add to booking_expenses table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_expenses' AND column_name = 'organization_id') THEN
        ALTER TABLE "booking_expenses" ADD "organization_id" uuid;
    END IF;
    
    -- Add to booking_revenues table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_revenues' AND column_name = 'organization_id') THEN
        ALTER TABLE "booking_revenues" ADD "organization_id" uuid;
    END IF;
    
    -- Step 5: Update all existing records to use the default organization
    UPDATE "users" SET "organization_id" = default_org_id WHERE "organization_id" IS NULL;
    UPDATE "roles" SET "organization_id" = default_org_id WHERE "organization_id" IS NULL;
    UPDATE "events" SET "organization_id" = default_org_id WHERE "organization_id" IS NULL;
    UPDATE "inventory_items" SET "organization_id" = default_org_id WHERE "organization_id" IS NULL;
    UPDATE "bookings" SET "organization_id" = default_org_id WHERE "organization_id" IS NULL;
    UPDATE "booking_expenses" SET "organization_id" = default_org_id WHERE "organization_id" IS NULL;
    UPDATE "booking_revenues" SET "organization_id" = default_org_id WHERE "organization_id" IS NULL;
    
    -- Step 6: Now make the columns NOT NULL (except for users and roles which can be nullable for Product Admin)
    ALTER TABLE "events" ALTER COLUMN "organization_id" SET NOT NULL;
    ALTER TABLE "inventory_items" ALTER COLUMN "organization_id" SET NOT NULL;
    ALTER TABLE "bookings" ALTER COLUMN "organization_id" SET NOT NULL;
    ALTER TABLE "booking_expenses" ALTER COLUMN "organization_id" SET NOT NULL;
    ALTER TABLE "booking_revenues" ALTER COLUMN "organization_id" SET NOT NULL;
    
    -- Step 7: Add foreign key constraints
    ALTER TABLE "users" ADD CONSTRAINT "FK_users_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL;
    ALTER TABLE "roles" ADD CONSTRAINT "FK_roles_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
    ALTER TABLE "events" ADD CONSTRAINT "FK_events_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
    ALTER TABLE "inventory_items" ADD CONSTRAINT "FK_inventory_items_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
    ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
    ALTER TABLE "booking_expenses" ADD CONSTRAINT "FK_booking_expenses_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
    ALTER TABLE "booking_revenues" ADD CONSTRAINT "FK_booking_revenues_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
    
    -- Step 8: Create indexes for performance
    CREATE INDEX IF NOT EXISTS "IDX_users_organization_id" ON "users" ("organization_id");
    CREATE INDEX IF NOT EXISTS "IDX_roles_organization_id" ON "roles" ("organization_id");
    CREATE INDEX IF NOT EXISTS "IDX_events_organization_id" ON "events" ("organization_id");
    CREATE INDEX IF NOT EXISTS "IDX_inventory_items_organization_id" ON "inventory_items" ("organization_id");
    CREATE INDEX IF NOT EXISTS "IDX_bookings_organization_id" ON "bookings" ("organization_id");
    CREATE INDEX IF NOT EXISTS "IDX_booking_expenses_organization_id" ON "booking_expenses" ("organization_id");
    CREATE INDEX IF NOT EXISTS "IDX_booking_revenues_organization_id" ON "booking_revenues" ("organization_id");
    
    RAISE NOTICE 'Migration completed successfully. Default organization ID: %', default_org_id;
END $$;
