-- MAEPLE Database Schema for Vercel Postgres
-- Run this in Vercel Postgres console or your PostgreSQL database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Health entries table
CREATE TABLE IF NOT EXISTS health_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  raw_text TEXT,
  mood INTEGER,
  mood_label VARCHAR(50),
  medications JSONB DEFAULT '[]',
  symptoms JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  activity_types JSONB DEFAULT '[]',
  strengths JSONB DEFAULT '[]',
  neuro_metrics JSONB DEFAULT '{}',
  sleep JSONB DEFAULT '{}',
  notes TEXT,
  ai_strategies JSONB DEFAULT '[]',
  ai_reasoning TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_health_entries_user_id ON health_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_health_entries_timestamp ON health_entries(timestamp DESC);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_entries_updated_at BEFORE UPDATE ON health_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();