-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (will be managed by Sequelize, but this is for reference)
-- The actual table will be created by Sequelize with proper migrations
-- This is just to ensure the database and extensions are ready

-- Grant all privileges to the postgres user
GRANT ALL PRIVILEGES ON DATABASE nestify_users TO postgres;

-- Create indexes for better performance (Sequelize will handle this, but included for reference)
-- CREATE INDEX idx_users_email ON users(email);
-- CREATE INDEX idx_users_phone ON users(phone);
-- CREATE INDEX idx_users_created_at ON users(created_at);

-- Print success message
DO $$ 
BEGIN 
  RAISE NOTICE 'PostgreSQL initialization completed successfully';
END $$;