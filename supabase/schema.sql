-- MAEPLE Supabase Database Schema
-- Run this in Supabase SQL Editor or via psql
-- This creates all tables with Row Level Security (RLS) for user isolation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- USER SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cycle_start_date DATE,
  avg_cycle_length INTEGER DEFAULT 28,
  safety_contact TEXT,
  notification_preferences JSONB DEFAULT '{}',
  sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Settings policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- HEALTH ENTRIES (Journal)
-- ============================================
CREATE TABLE IF NOT EXISTS health_entries (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  raw_text TEXT,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  mood_label TEXT,
  medications JSONB DEFAULT '[]',
  symptoms JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  activity_types TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  neuro_metrics JSONB,
  sleep JSONB,
  notes TEXT,
  ai_strategies JSONB DEFAULT '[]',
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_health_entries_user_timestamp 
  ON health_entries(user_id, timestamp DESC);

-- Enable RLS on health_entries
ALTER TABLE health_entries ENABLE ROW LEVEL SECURITY;

-- Health entries policies
CREATE POLICY "Users can view own entries" ON health_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries" ON health_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON health_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" ON health_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STATE CHECKS (Bio-Mirror)
-- ============================================
CREATE TABLE IF NOT EXISTS state_checks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  analysis_cipher TEXT, -- Encrypted facial analysis (AES-GCM)
  iv TEXT, -- Initialization vector for decryption
  user_note TEXT,
  -- We don't store images in Supabase for privacy - only metadata
  has_image BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_state_checks_user_timestamp 
  ON state_checks(user_id, timestamp DESC);

-- Enable RLS on state_checks
ALTER TABLE state_checks ENABLE ROW LEVEL SECURITY;

-- State checks policies
CREATE POLICY "Users can view own state checks" ON state_checks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own state checks" ON state_checks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own state checks" ON state_checks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own state checks" ON state_checks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FACIAL BASELINES (Bio-Mirror Calibration)
-- ============================================
CREATE TABLE IF NOT EXISTS facial_baselines (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  neutral_tension FLOAT,
  neutral_fatigue FLOAT,
  neutral_masking FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- Only one baseline per user
);

-- Enable RLS on facial_baselines
ALTER TABLE facial_baselines ENABLE ROW LEVEL SECURITY;

-- Facial baselines policies
CREATE POLICY "Users can view own baseline" ON facial_baselines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own baseline" ON facial_baselines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own baseline" ON facial_baselines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own baseline" ON facial_baselines
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- WEARABLE DATA
-- ============================================
CREATE TABLE IF NOT EXISTS wearable_data (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  provider TEXT NOT NULL,
  synced_at TIMESTAMPTZ,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, provider)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_wearable_data_user_date 
  ON wearable_data(user_id, date DESC);

-- Enable RLS on wearable_data
ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;

-- Wearable data policies
CREATE POLICY "Users can view own wearable data" ON wearable_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wearable data" ON wearable_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wearable data" ON wearable_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wearable data" ON wearable_data
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SYNC METADATA (tracks what's been synced)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_sync_at TIMESTAMPTZ,
  entries_synced INTEGER DEFAULT 0,
  state_checks_synced INTEGER DEFAULT 0,
  sync_status TEXT DEFAULT 'never',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on sync_metadata
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

-- Sync metadata policies
CREATE POLICY "Users can view own sync metadata" ON sync_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync metadata" ON sync_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync metadata" ON sync_metadata
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.sync_metadata (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_entries_updated_at
  BEFORE UPDATE ON health_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wearable_data_updated_at
  BEFORE UPDATE ON wearable_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE
-- ============================================
-- Schema created successfully!
-- All tables have Row Level Security enabled.
-- Users can only access their own data.
