-- Household profiles + JSON sync blob (auth-required app, Phase 3)

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

create table public.household_data (
  household_id uuid primary key references public.households (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  version int not null default 1,
  updated_at timestamptz not null default now()
);

create index households_owner_id_idx on public.households (owner_id);

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_data enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy households_select_own on public.households
  for select to authenticated
  using (auth.uid() = owner_id);

create policy households_insert_own on public.households
  for insert to authenticated
  with check (auth.uid() = owner_id);

create policy households_update_own on public.households
  for update to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy household_data_select_own on public.household_data
  for select to authenticated
  using (
    exists (
      select 1 from public.households h
      where h.id = household_data.household_id
        and h.owner_id = auth.uid()
    )
  );

create policy household_data_insert_own on public.household_data
  for insert to authenticated
  with check (
    exists (
      select 1 from public.households h
      where h.id = household_data.household_id
        and h.owner_id = auth.uid()
    )
  );

create policy household_data_update_own on public.household_data
  for update to authenticated
  using (
    exists (
      select 1 from public.households h
      where h.id = household_data.household_id
        and h.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.households h
      where h.id = household_data.household_id
        and h.owner_id = auth.uid()
    )
  );

-- Bootstrap profile + household on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
begin
  insert into public.profiles (id, locale)
  values (new.id, coalesce(new.raw_user_meta_data->>'locale', 'en'));

  insert into public.households (owner_id)
  values (new.id)
  returning id into new_household_id;

  insert into public.household_data (household_id, data)
  values (new_household_id, '{}'::jsonb);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Link advice audit to households (optional FK)
alter table public.advice_runs
  drop constraint if exists advice_runs_household_id_fkey;

alter table public.advice_runs
  add constraint advice_runs_household_id_fkey
  foreign key (household_id) references public.households (id) on delete set null;
