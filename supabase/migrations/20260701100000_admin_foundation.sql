-- Admin foundation: profiles.role, is_admin(), admin audit log

alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin'));

drop policy if exists profiles_update_own on public.profiles;

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  target_user_id uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_admin_id_created_at_idx
  on public.admin_audit_log (admin_id, created_at desc);

alter table public.admin_audit_log enable row level security;

-- No client policies — service role / admin edge only

comment on column public.profiles.role is 'user | admin — writable only via service role (admin edge)';
