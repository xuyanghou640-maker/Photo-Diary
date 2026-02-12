-- Fix missing username column in profiles table
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    -- 1. Check if 'username' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') THEN
        ALTER TABLE public.profiles ADD COLUMN username text UNIQUE;
    END IF;

    -- 2. Check if 'full_name' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name text;
    END IF;

    -- 3. Check if 'avatar_url' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    END IF;

    -- 4. Check if 'short_id' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'short_id') THEN
        ALTER TABLE public.profiles ADD COLUMN short_id text UNIQUE;
    END IF;

END $$;

-- 5. Force reload of schema cache
NOTIFY pgrst, 'reload config';