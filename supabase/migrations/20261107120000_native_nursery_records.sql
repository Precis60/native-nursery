-- Native Nursery recorded actuals: sales, expenses, batches, orders, labour
-- weeks and the checklist/purchase flag row (kind = 'state').
-- Apply after the owner-allowlist migration: policies call
-- private.native_nursery_is_owner(), which that migration creates.
-- Same rules as the scenario table: grants are explicit, anon receives none,
-- policies use auth.uid() plus the allowlist, and the client writes updated_at.

create table public.native_nursery_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('sale', 'expense', 'batch', 'order', 'labour', 'state')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.native_nursery_records is
  'Private recorded actuals for the running nursery. Each row belongs to auth.uid().';

create index native_nursery_records_owner_kind_updated
  on public.native_nursery_records (user_id, kind, updated_at desc);

alter table public.native_nursery_records enable row level security;

revoke all on table public.native_nursery_records from public, anon;

grant select, insert, update, delete on table public.native_nursery_records to authenticated;
grant select, insert, update, delete on table public.native_nursery_records to service_role;
revoke truncate, trigger, references on table public.native_nursery_records from authenticated, anon, public, service_role;

create policy native_nursery_records_select_owner
  on public.native_nursery_records
  for select
  to authenticated
  using ((select private.native_nursery_is_owner()) and user_id = (select auth.uid()));

create policy native_nursery_records_insert_owner
  on public.native_nursery_records
  for insert
  to authenticated
  with check ((select private.native_nursery_is_owner()) and user_id = (select auth.uid()));

create policy native_nursery_records_update_owner
  on public.native_nursery_records
  for update
  to authenticated
  using ((select private.native_nursery_is_owner()) and user_id = (select auth.uid()))
  with check ((select private.native_nursery_is_owner()) and user_id = (select auth.uid()));

create policy native_nursery_records_delete_owner
  on public.native_nursery_records
  for delete
  to authenticated
  using ((select private.native_nursery_is_owner()) and user_id = (select auth.uid()));
