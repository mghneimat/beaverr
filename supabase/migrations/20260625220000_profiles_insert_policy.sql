-- Allow authenticated users to upsert their own profile row (sign-up username claim fallback)

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);
