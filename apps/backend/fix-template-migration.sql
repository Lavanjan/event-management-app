-- Fix the migration issues
-- First, create event_templates table if it doesn't exist
DO $$
BEGIN
    -- Create event_templates table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'event_templates'
    ) THEN
        CREATE TABLE event_templates (
            id uuid NOT NULL DEFAULT uuid_generate_v4(),
            name character varying NOT NULL,
            description character varying,
            category character varying,
            default_duration_hours integer NOT NULL DEFAULT 4,
            default_capacity integer,
            default_location character varying,
            default_hourly_price numeric(10,2),
            default_half_day_price numeric(10,2),
            default_full_day_price numeric(10,2),
            required_advance_percentage integer NOT NULL DEFAULT 50,
            balance_payment_window_days integer NOT NULL DEFAULT 7,
            allow_inventory_allocation boolean NOT NULL DEFAULT true,
            require_approval boolean NOT NULL DEFAULT false,
            auto_confirm boolean NOT NULL DEFAULT true,
            required_inventory jsonb DEFAULT '[]',
            default_inventory_allocations jsonb DEFAULT '[]',
            template_settings jsonb DEFAULT '{}',
            usage_count integer NOT NULL DEFAULT 0,
            last_used_at TIMESTAMP,
            organization_id uuid NOT NULL,
            is_active boolean NOT NULL DEFAULT true,
            is_public boolean NOT NULL DEFAULT false,
            created_by uuid,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            updated_at TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "CHK_b486a56ef21c4f8c152dabdac7" CHECK (balance_payment_window_days >= 0),
            CONSTRAINT "CHK_cb7324e38ad7ea795e838b8d64" CHECK (required_advance_percentage >= 0 AND required_advance_percentage <= 100),
            CONSTRAINT "CHK_1701b01be996b02aa6a5aacc19" CHECK (default_full_day_price IS NULL OR default_full_day_price >= 0),
            CONSTRAINT "CHK_5670e7fac285fdc0155021b498" CHECK (default_half_day_price IS NULL OR default_half_day_price >= 0),
            CONSTRAINT "CHK_a42719092d76314c78a51fcc5c" CHECK (default_hourly_price IS NULL OR default_hourly_price >= 0),
            CONSTRAINT "CHK_724876bc90591db8d9f90ce83f" CHECK (default_capacity IS NULL OR default_capacity > 0),
            CONSTRAINT "CHK_0622e1a7caa8483feb001a31cd" CHECK (default_duration_hours > 0),
            CONSTRAINT "PK_b79b161f3efa82671d8cc2250fe" PRIMARY KEY (id)
        );
        
        -- Create indexes
        CREATE INDEX "IDX_27a5e6f1893f788c8a2861068b" ON event_templates (category);
        CREATE INDEX "IDX_91d72610f2d002935acbb01b64" ON event_templates (is_active);
        CREATE INDEX "IDX_b9e69f08cc2a4186f95aaf5ab6" ON event_templates (organization_id);
    END IF;

    -- Add template_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'template_id'
    ) THEN
        ALTER TABLE events ADD COLUMN template_id uuid;
    END IF;

    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'FK_9b84a662c6de080a196443c50c0'
    ) THEN
        ALTER TABLE events ADD CONSTRAINT "FK_9b84a662c6de080a196443c50c0"
        FOREIGN KEY (template_id) REFERENCES event_templates(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Mark the migration as completed
INSERT INTO migrations (timestamp, name)
VALUES (1759382552649, 'AddEventTemplateSupport1759382552649');

-- Insert some sample event templates for testing
INSERT INTO event_templates (
    name, description, category, default_duration_hours, default_capacity,
    default_location, default_hourly_price, default_half_day_price, default_full_day_price,
    required_advance_percentage, balance_payment_window_days,
    allow_inventory_allocation, require_approval, auto_confirm,
    organization_id, is_public, created_by
) VALUES 
(
    'Corporate Meeting', 
    'Standard corporate meeting template with basic amenities',
    'Business',
    4,
    50,
    'Conference Room A',
    100.00,
    350.00,
    600.00,
    50,
    7,
    true,
    false,
    true,
    (SELECT id FROM organizations LIMIT 1),
    true,
    (SELECT id FROM users WHERE user_type = 'product_admin' LIMIT 1)
),
(
    'Wedding Reception',
    'Complete wedding reception template with catering and decoration',
    'Wedding',
    8,
    200,
    'Grand Ballroom',
    200.00,
    1200.00,
    2000.00,
    60,
    14,
    true,
    true,
    false,
    (SELECT id FROM organizations LIMIT 1),
    true,
    (SELECT id FROM users WHERE user_type = 'product_admin' LIMIT 1)
),
(
    'Birthday Party',
    'Fun birthday party template for all ages',
    'Party',
    4,
    30,
    'Party Hall',
    75.00,
    250.00,
    400.00,
    40,
    5,
    true,
    false,
    true,
    (SELECT id FROM organizations LIMIT 1),
    true,
    (SELECT id FROM users WHERE user_type = 'product_admin' LIMIT 1)
);
