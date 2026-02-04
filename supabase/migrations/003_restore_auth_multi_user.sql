-- Migration: Restore multi-user auth support
-- Run this in your Supabase SQL Editor
--
-- IMPORTANT: After running this migration, you need to migrate your existing
-- data from the old single-user ID to your real user ID. Run:
--
--   UPDATE collections SET user_id = '<your-auth-user-uuid>' WHERE user_id = '00000000-0000-0000-0000-000000000001';
--   UPDATE cards SET user_id = '<your-auth-user-uuid>' WHERE user_id = '00000000-0000-0000-0000-000000000001';
--   UPDATE dialogues SET user_id = '<your-auth-user-uuid>' WHERE user_id = '00000000-0000-0000-0000-000000000001';
--   UPDATE study_sessions SET user_id = '<your-auth-user-uuid>' WHERE user_id = '00000000-0000-0000-0000-000000000001';
--
-- Replace <your-auth-user-uuid> with your actual Supabase auth user ID.
-- You can find it in Supabase Dashboard > Authentication > Users.

-- Step 1: Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name text DEFAULT 'Learner',
    level int DEFAULT 1,
    target_language text DEFAULT 'Chinese',
    native_language text DEFAULT 'English',
    streak int DEFAULT 0,
    total_cards_learned int DEFAULT 0,
    daily_goal int DEFAULT 10,
    settings jsonb DEFAULT '{}'::jsonb,
    onboarded boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO profiles (id, name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Learner'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Step 3: Remove hardcoded default user_id from tables
ALTER TABLE collections ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE cards ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE dialogues ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE study_sessions ALTER COLUMN user_id DROP DEFAULT;

-- Step 4: Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Collections: users can only access their own collections
CREATE POLICY "Users can view own collections" ON collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own collections" ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON collections FOR DELETE USING (auth.uid() = user_id);

-- Cards: users can only access their own cards
CREATE POLICY "Users can view own cards" ON cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cards" ON cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards" ON cards FOR DELETE USING (auth.uid() = user_id);

-- Dialogues: users can only access their own dialogues
CREATE POLICY "Users can view own dialogues" ON dialogues FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dialogues" ON dialogues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own dialogues" ON dialogues FOR DELETE USING (auth.uid() = user_id);

-- Study sessions: users can only access their own sessions
CREATE POLICY "Users can view own sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 6: Index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
