-- Lets the signed-in browser ask whether this session is the allowlisted owner.
-- The helper stays in private. This wrapper is security invoker and returns
-- only true or false. It does not accept or embed a user id.

create or replace function public.native_nursery_session_is_owner()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.native_nursery_is_owner();
$$;

revoke all on function public.native_nursery_session_is_owner() from public, anon;
grant execute on function public.native_nursery_session_is_owner() to authenticated, service_role;
