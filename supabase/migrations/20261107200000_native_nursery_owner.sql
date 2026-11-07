-- Owner enrolment is not performed by this migration.
-- The previous statement on main inserted 2831be20-5ba9-4875-b73e-28c058c9ce2f.
-- That id is not the confirmed sole owner, 9620ed25-64c9-46b7-9d16-a1b2a03f8802.
-- The confirmed id is not in auth.users, so an insert would fail the foreign key.
-- Inserting the other auth user would allowlist a different person.
-- Leave private.native_nursery_app_owners unchanged.

do $$
begin
  null;
end $$;
