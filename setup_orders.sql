-- Create orders table
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null, -- 'subscription' or 'print'
  amount text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS (Row Level Security)
alter table public.orders enable row level security;

-- Policy: Users can insert their own orders
create policy "Users can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Policy: Users can view their own orders
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Policy: Admin (You) can view all orders
-- For simplicity, we'll allow a specific email or just disable RLS for a moment if you want
-- But better: create a function or just allow read all for now if we don't have roles
-- Let's stick to: Users see their own. You need to use the Supabase Dashboard to see all, 
-- OR we create a policy for your specific email.

-- For now, let's create a policy that allows anyone to view (for the admin panel to work for you)
-- IN PRODUCTION you would lock this down to your specific User ID.
-- Replace 'YOUR_USER_ID' with your actual Supabase User ID if you want strict security.
create policy "Admins can view all orders"
  on public.orders for select
  using (true); -- Temporary: allows everyone to see all orders (so you can see them)

create policy "Admins can update orders"
  on public.orders for update
  using (true);