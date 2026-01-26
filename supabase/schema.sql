-- Supabase Schema for LinguaFlow (Single-User Mode - No Auth Required)
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Fixed user ID for single-user mode
-- This matches SINGLE_USER_ID in supabase.js
-- DO NOT CHANGE unless you also update the JS code
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'single_user_id') THEN
        CREATE DOMAIN single_user_id AS uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
    END IF;
END
$$;

-- Collections table (no foreign key to profiles)
create table if not exists collections (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
    name text not null,
    emoji text default '📚',
    image text,
    card_count int default 0,
    mastered int default 0,
    due_cards int default 0,
    last_studied timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cards table
create table if not exists cards (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
    collection_id uuid references collections(id) on delete cascade not null,
    front text not null,
    back text not null,
    reading text,
    example text,
    example_translation text,
    example_reading text,
    example_audio text,
    image text,
    audio text,
    questions jsonb default '[]'::jsonb,
    difficulty int default 2,
    next_review timestamp with time zone default timezone('utc'::text, now()),
    last_review timestamp with time zone,
    interval int default 1,
    ease_factor decimal default 2.5,
    review_count int default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Dialogues table
create table if not exists dialogues (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
    title text not null,
    setting text,
    duration int,
    lines jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Study sessions table (for tracking daily activity)
create table if not exists study_sessions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid default '00000000-0000-0000-0000-000000000001'::uuid not null,
    cards_studied int default 0,
    time_spent int default 0, -- in seconds
    date date default current_date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) - DISABLED for single-user mode
alter table collections disable row level security;
alter table cards disable row level security;
alter table dialogues disable row level security;
alter table study_sessions disable row level security;

-- Function to update card counts in collections
create or replace function update_collection_card_count()
returns trigger as $$
begin
    if TG_OP = 'INSERT' then
        update collections
        set card_count = card_count + 1,
            due_cards = due_cards + 1,
            updated_at = now()
        where id = NEW.collection_id;
        return NEW;
    elsif TG_OP = 'DELETE' then
        update collections
        set card_count = card_count - 1,
            updated_at = now()
        where id = OLD.collection_id;
        return OLD;
    end if;
    return null;
end;
$$ language plpgsql security definer;

-- Trigger to update collection counts
drop trigger if exists on_card_change on cards;
create trigger on_card_change
    after insert or delete on cards
    for each row execute procedure update_collection_card_count();

-- Index for faster queries
create index if not exists idx_cards_user_id on cards(user_id);
create index if not exists idx_cards_collection_id on cards(collection_id);
create index if not exists idx_cards_next_review on cards(next_review);
create index if not exists idx_collections_user_id on collections(user_id);
create index if not exists idx_dialogues_user_id on dialogues(user_id);
create index if not exists idx_study_sessions_user_date on study_sessions(user_id, date);
