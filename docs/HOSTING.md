# Hosting

This repository is the GitHub Pages source for Native Nursery. The site is a static Vite build. No other host is used.

GitHub Actions workflow `.github/workflows/pages.yml` runs on `main`. It tests, builds, and deploys with the GitHub Pages action. The asset base is `/native-nursery/`. Routes stay in the hash (`#/species`, `#/shopping`), so Pages does not need a rewrite. Auth uses PKCE query parameters rather than an access token in the hash.

The project Pages address is `https://precis60.github.io/native-nursery/`. Treat that address as the live site only after the Actions deployment has succeeded.

The production build passes the public client settings under the names the app reads:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Those values are the project URL and the publishable key. A repository variable of the same name overrides the public default in the workflow. Do not put a service role key in the workflow.

Repository variable `NATIVE_NURSERY_PAGES_ENABLED` is the Pages flag. Set it to `true` only when this workflow is the Pages source and the publishable key is the one in the client build.

Until a deployment is confirmed, you can still run the planner locally:

```
npm install
npm test
npm run dev
```

The dev server listens on port 4179.
