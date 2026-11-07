-- Owner enrolment for Native Nursery.
-- The auth.users row was created in the Supabase dashboard first; this row
-- switches on the owner allowlist that the scenario and records policies call.
-- Apply after the owner-allowlist migration. on conflict keeps a re-run safe.

insert into private.native_nursery_app_owners (user_id)
values ('2831be20-5ba9-4875-b73e-28c058c9ce2f')
on conflict (user_id) do nothing;
