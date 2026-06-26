-- Allow authenticated users to delete their own auth.users row (cascades to profiles, households, etc.)

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
