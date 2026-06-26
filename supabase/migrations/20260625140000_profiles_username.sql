-- Unique usernames on profiles (case-insensitive)

alter table public.profiles
  add column if not exists username text;

create unique index if not exists profiles_username_lower_unique_idx
  on public.profiles (lower(username))
  where username is not null;

-- Pre-sign-up availability check (anon-safe — boolean only, no row data)
create or replace function public.is_username_available(check_username text)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  normalized text;
begin
  normalized := lower(trim(check_username));

  if normalized is null or length(normalized) < 3 or length(normalized) > 20 then
    return false;
  end if;

  return not exists (
    select 1
    from public.profiles p
    where p.username is not null
      and lower(p.username) = normalized
  );
end;
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;
