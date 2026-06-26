-- Ensure delete_own_account can remove auth.users on Supabase hosted (postgres owner + execute grant)

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

alter function public.delete_own_account() owner to postgres;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
