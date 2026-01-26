-- Migration: Remove authentication, switch to single-user mode
-- Run this in your Supabase SQL Editor if you have an existing database with auth

-- Step 1: Drop old tables that depend on auth (if they exist)
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS dialogues CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 2: Drop old triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_card_change ON cards;

-- Step 3: Recreate tables without auth dependencies
-- (Just run the main schema.sql after this, or copy the CREATE TABLE statements from there)

-- Step 4: Disable RLS on all tables
-- ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE cards DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE dialogues DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE study_sessions DISABLE ROW LEVEL SECURITY;

-- After running this, run the full schema.sql to recreate the tables
