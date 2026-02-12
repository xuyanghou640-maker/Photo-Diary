-- =========================================================
-- 🛠️ Profile System Setup (Idempotent Version)
-- =========================================================

-- 1. Create profiles table (if not exists)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  short_id text unique
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Safely create policies (drop first to avoid 42710 error)
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 4. Create/Update Trigger Function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, short_id)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    -- Generate a simple 6-digit random ID
    upper(substring(md5(random()::text) from 1 for 6)) 
  )
  on conflict (id) do nothing; -- Handle existing profiles gracefully
  return new;
end;
$$;

-- 5. Recreate Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Backfill existing users (Safe Insert)
insert into public.profiles (id, short_id)
select 
  id, 
  upper(substring(md5(random()::text) from 1 for 6))
from auth.users
where id not in (select id from public.profiles)
on conflict do nothing;

-- 7. Setup Storage (Idempotent)
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage Policies
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

drop policy if exists "Anyone can upload an avatar." on storage.objects;
create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

drop policy if exists "Users can update their own avatar." on storage.objects;
create policy "Users can update their own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' );