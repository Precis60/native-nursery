-- Native Nursery scenario storage.
-- Do not apply this until the Supabase project is confirmed.
--
-- Checked against current Supabase docs on 6 Nov 2026:
-- https://supabase.com/docs/guides/api/securing-your-api
-- https://supabase.com/docs/guides/database/postgres/row-level-security
-- New tables are not given automatic Data API grants. Grants are explicit,
-- in this same migration, and anon receives none.
-- UPDATE is paired with SELECT so PostgREST can return the updated row.
-- No view is created. A later view must use WITH (security_invoker = true).
-- Policies use auth.uid() only. user_metadata is not an access decision.
-- There is no trigger function in public, so nothing here is an RPC.
-- updated_at is written by the signed-in client on update.

create table public.native_nursery_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  inputs jsonb not null check (jsonb_typeof(inputs) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.native_nursery_scenarios is
  'Private year-1 nursery scenarios. Each row belongs to auth.uid().';

create index native_nursery_scenarios_owner_updated
  on public.native_nursery_scenarios (user_id, updated_at desc);

alter table public.native_nursery_scenarios enable row level security;

revoke all on table public.native_nursery_scenarios from public, anon;

grant select, insert, update, delete on table public.native_nursery_scenarios to authenticated;
grant select, insert, update, delete on table public.native_nursery_scenarios to service_role;

create policy native_nursery_scenarios_select_own
  on public.native_nursery_scenarios
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy native_nursery_scenarios_insert_own
  on public.native_nursery_scenarios
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy native_nursery_scenarios_update_own
  on public.native_nursery_scenarios
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy native_nursery_scenarios_delete_own
  on public.native_nursery_scenarios
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
