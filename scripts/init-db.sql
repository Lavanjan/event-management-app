-- Initialize database with required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- These will be created by TypeORM migrations, but having them here as reference

-- User table indexes
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Inventory table indexes  
-- CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory_items(name);
-- CREATE INDEX IF NOT EXISTS idx_inventory_active ON inventory_items(is_active);
-- CREATE INDEX IF NOT EXISTS idx_inventory_available ON inventory_items(available_quantity);

-- Event table indexes
-- CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
-- CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);

-- Booking table indexes
-- CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
-- CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
-- CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
-- CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);

-- Full text search indexes
-- CREATE INDEX IF NOT EXISTS idx_inventory_search ON inventory_items USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
-- CREATE INDEX IF NOT EXISTS idx_events_search ON events USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Set timezone
SET timezone = 'UTC';
