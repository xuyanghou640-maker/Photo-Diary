-- =========================================================
-- 🛠️ Migration: Add short_id column to profiles
-- =========================================================

-- 1. Add short_id column if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'short_id') then
    alter table public.profiles add column short_id text unique;
  end if;
end $$;

-- 2. Backfill short_id for existing profiles that have null
update public.profiles
set short_id = upper(substring(md5(random()::text) from 1 for 6))
where short_id is null;

-- 3. Backfill missing profiles entirely (as per previous script logic)
insert into public.profiles (id, short_id)
select 
  id, 
  upper(substring(md5(random()::text) from 1 for 6))
from auth.users
where id not in (select id from public.profiles)
on conflict do nothing;