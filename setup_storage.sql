-- Create the avatars bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Remove existing policies to avoid conflicts when re-running
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Users can update their own avatars" on storage.objects;

-- Create policy to allow public viewing of avatars
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Create policy to allow authenticated users to upload avatars
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- Create policy to allow users to update their own avatars
create policy "Users can update their own avatars"
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'avatars' );

-- Create policy to allow users to delete their own avatars
create policy "Users can delete their own avatars"
  on storage.objects for delete
  using ( auth.uid() = owner and bucket_id = 'avatars' );