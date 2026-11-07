-- Single-owner access for Native Nursery.
-- The allowlist lives in schema private, which is not exposed by the Data API.
-- Membership is not taken from user_metadata and is not granted by signing up.
-- No owner row is inserted here: auth.users was empty when this was written,
-- and an identity must not be guessed. After the owner account exists, insert
-- that auth.users id with the statement at the bottom.

create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create table if not exists private.native_nursery_app_owners (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table private.native_nursery_app_owners enable row level security;

revoke all on table private.native_nursery_app_owners from public, anon, authenticated;
grant select, insert, update, delete on table private.native_nursery_app_owners to service_role;

create or replace function private.native_nursery_is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.native_nursery_app_owners
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.native_nursery_is_owner() from public, anon;
grant execute on function private.native_nursery_is_owner() to authenticated, service_role;

drop policy if exists native_nursery_scenarios_select_own on public.native_nursery_scenarios;
drop policy if exists native_nursery_scenarios_insert_own on public.native_nursery_scenarios;
drop policy if exists native_nursery_scenarios_update_own on public.native_nursery_scenarios;
drop policy if exists native_nursery_scenarios_delete_own on public.native_nursery_scenarios;

create policy native_nursery_scenarios_select_owner
  on public.native_nursery_scenarios
  for select
  to authenticated
  using ((select private.native_nursery_is_owner()) and user_id = (select auth.uid()));

create policy native_nursery_scenarios_insert_owner
  on public.native_nursery_scenarios
  for insert
  to authenticated
  with check ((select private.native_nursery_is_owner()) and user_id = (select auth.uid()));

create policy native_nursery_scenarios_update_owner
  on public.native_nursery_scenarios
  for update
  to authenticated
  using ((select private.native_nursery_is_owner()) and user_id = (select auth.uid()))
  with check ((select private.native_nursery_is_owner()) and user_id = (select auth.uid()));

create policy native_nursery_scenarios_delete_owner
  on public.native_nursery_scenarios
  for delete
  to authenticated
  using ((select private.native_nursery_is_owner()) and user_id = (select auth.uid()));

revoke all on table public.native_nursery_scenarios from public, anon;
grant select, insert, update, delete on table public.native_nursery_scenarios to authenticated;
grant select, insert, update, delete on table public.native_nursery_scenarios to service_role;
revoke truncate, trigger, references on table public.native_nursery_scenarios from authenticated, anon, public, service_role;

-- Owner enrolment, run only after the account exists in Authentication.
-- Replace the uuid from Authentication → Users. Do not use an email lookup.
-- insert into private.native_nursery_app_owners (user_id)
-- values ('00000000-0000-0000-0000-000000000000');
