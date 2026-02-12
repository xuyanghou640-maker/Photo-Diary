-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Public User Info)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- RLS for Profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);
create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Groups Table
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique not null,
  color text default '#blue',
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Groups
alter table public.groups enable row level security;
create policy "Groups are viewable by authenticated users" on public.groups
  for select using (auth.role() = 'authenticated');
create policy "Users can create groups" on public.groups
  for insert with check (auth.uid() = created_by);
create policy "Owners can update groups" on public.groups
  for update using (auth.uid() = created_by);
create policy "Owners can delete groups" on public.groups
  for delete using (auth.uid() = created_by);

-- 3. Group Members Table
create table public.group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  role text check (role in ('owner', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- RLS for Group Members
alter table public.group_members enable row level security;
create policy "Group members are viewable by group members" on public.group_members
  for select using (
    auth.uid() in (
      select user_id from public.group_members where group_id = group_id
    )
  );
create policy "Users can join groups" on public.group_members
  for insert with check (auth.uid() = user_id);
create policy "Members can leave groups" on public.group_members
  for delete using (auth.uid() = user_id);

-- 4. Friend Requests Table
create table public.friend_requests (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) not null,
  receiver_id uuid references public.profiles(id) not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(sender_id, receiver_id)
);

-- RLS for Friend Requests
alter table public.friend_requests enable row level security;
create policy "Users can view their own requests" on public.friend_requests
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send requests" on public.friend_requests
  for insert with check (auth.uid() = sender_id);
create policy "Receiver can update status" on public.friend_requests
  for update using (auth.uid() = receiver_id);

-- 5. Diary Entries (Real Data for Groups)
create table public.diary_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  group_id uuid references public.groups(id), -- Nullable (Personal)
  photo_url text,
  caption text,
  mood text,
  location jsonb,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Entries
alter table public.diary_entries enable row level security;
create policy "Users can view entries in their groups" on public.diary_entries
  for select using (
    auth.uid() = user_id 
    or 
    group_id in (select group_id from public.group_members where user_id = auth.uid())
  );
create policy "Users can insert entries" on public.diary_entries
  for insert with check (auth.uid() = user_id);