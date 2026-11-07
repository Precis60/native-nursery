# Supabase

Project `xhmzhtdhszirbbiwvbqz` (Native Nursery) is the database for this app. The scenario migration and the owner-allowlist migration are already applied. Do not run them again, and do not change unrelated projects.

Checked after those migrations:

- `public.native_nursery_scenarios` has no rows.
- `private.native_nursery_app_owners` has no rows.
- `auth.users` has no rows.

Cloud save is not working. This app does not create the owner and does not send mail. After the owner account exists in Authentication, insert that user id in the SQL editor:

```sql
insert into private.native_nursery_app_owners (user_id)
values ('00000000-0000-0000-0000-000000000000');
```

Replace the placeholder. The placeholder was not executed. Do not look the id up by email in application code.

## Client settings

The browser reads only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Use the publishable key. The app refuses a key that looks like a service role. Copy the two names into `.env.local` for local development. The Pages workflow already supplies them for the production build.

In Authentication, keep public signup off if the dashboard allows it. The app itself has no registration control. Add `https://precis60.github.io/native-nursery/` as the Site URL and to the redirect allow list. The app sends `window.location.origin + window.location.pathname`, with no hash.

## Access rules

Table `public.native_nursery_scenarios` stores `user_id`, `name` and a JSON `inputs` object.

Access is a single-owner allowlist in `private.native_nursery_app_owners`. The Data API does not expose that schema. The four policies (`select`, `insert`, `update`, `delete`) allow a signed-in user to touch a row only when `private.native_nursery_is_owner()` is true and `user_id = auth.uid()`. The update policy has both `using` and `with check`. Signing up does not add anyone to the allowlist. `user_metadata` is not consulted.

`anon` has no privilege on the scenario table. `authenticated` is not granted write on the owner table. The browser is not given the service role.

Row Level Security is enabled. No view is created. If you add one, create it `with (security_invoker = true)`. No security-definer function is placed in `public`.

The app sets `updated_at` on update. There is no public trigger function, which keeps the table from growing an RPC endpoint.
