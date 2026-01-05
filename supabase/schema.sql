-- Supabase Schema for LinguaFlow
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
create table if not exists profiles (
    id uuid references auth.users on delete cascade primary key,
    name text,
    level int default 1,
    target_language text default 'Spanish',
    native_language text default 'English',
    streak int default 0,
    total_cards_learned int default 0,
    daily_goal int default 20,
    settings jsonb default '{"audioAutoplay": false, "hapticFeedback": true, "darkMode": true, "reminderTime": "20:00", "streakFreezeAlerts": true}'::jsonb,
    onboarded boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Collections table
create table if not exists collections (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
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
    user_id uuid references profiles(id) on delete cascade not null,
    collection_id uuid references collections(id) on delete cascade not null,
    front text not null,
    back text not null,
    reading text,
    example text,
    example_translation text,
    image text,
    audio text,
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
    user_id uuid references profiles(id) on delete cascade not null,
    title text not null,
    setting text,
    duration int,
    lines jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Study sessions table (for tracking daily activity)
create table if not exists study_sessions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    cards_studied int default 0,
    time_spent int default 0, -- in seconds
    date date default current_date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) policies
alter table profiles enable row level security;
alter table collections enable row level security;
alter table cards enable row level security;
alter table dialogues enable row level security;
alter table study_sessions enable row level security;

-- Profiles: users can only see/edit their own profile
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Collections: users can only see/edit their own collections
create policy "Users can view own collections" on collections for select using (auth.uid() = user_id);
create policy "Users can insert own collections" on collections for insert with check (auth.uid() = user_id);
create policy "Users can update own collections" on collections for update using (auth.uid() = user_id);
create policy "Users can delete own collections" on collections for delete using (auth.uid() = user_id);

-- Cards: users can only see/edit their own cards
create policy "Users can view own cards" on cards for select using (auth.uid() = user_id);
create policy "Users can insert own cards" on cards for insert with check (auth.uid() = user_id);
create policy "Users can update own cards" on cards for update using (auth.uid() = user_id);
create policy "Users can delete own cards" on cards for delete using (auth.uid() = user_id);

-- Dialogues: users can only see/edit their own dialogues
create policy "Users can view own dialogues" on dialogues for select using (auth.uid() = user_id);
create policy "Users can insert own dialogues" on dialogues for insert with check (auth.uid() = user_id);
create policy "Users can delete own dialogues" on dialogues for delete using (auth.uid() = user_id);

-- Study sessions: users can only see/edit their own sessions
create policy "Users can view own sessions" on study_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on study_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on study_sessions for update using (auth.uid() = user_id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, name)
    values (new.id, new.raw_user_meta_data->>'name');
    return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

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
