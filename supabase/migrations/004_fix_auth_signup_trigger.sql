-- Migration: Fix auth signup trigger for profile creation
-- Run this after 003_restore_auth_multi_user.sql
--
-- Why: Supabase Auth signup can fail with 500 "unexpected_failure" when the
-- trigger function cannot resolve the profiles table due to search_path/schema issues.

-- Ensure profiles table exists in public schema
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Replace trigger function with schema-qualified, search_path-safe version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Learner'))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Recreate auth trigger pointing at public.handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
