-- Migration: Add missing 'questions' column to cards table
-- Run this in your Supabase SQL Editor if you have an existing database

-- Add the questions column (JSONB array to store card questions)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]'::jsonb;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'cards' AND column_name = 'questions';
