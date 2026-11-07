# Native Nursery

Year-1 planner for an independent Australian native nursery, aimed at a proposed rented site near Geelong. It is a static app published from this repository with GitHub Pages. Scenarios can stay in this browser. Account save is not available until the owner is set up.

## Run locally

```bash
npm install
npm test
npm run dev
```

The dev server is [http://127.0.0.1:4179/native-nursery/](http://127.0.0.1:4179/native-nursery/). The asset base matches GitHub project Pages.

`npm run build` typechecks and writes `dist/`. `npm run test:e2e` runs Playwright against the dev server and saves screenshots under `test-results/screenshots/`.

## What the planner does

- Edit a sales target, tube and 140 mm mix, and ex-GST prices. The default prices are the midpoints of the prior planning ranges, tubes $1.80–$2.50 and 140 mm $6–$10. Those ranges are not current quotes.
- Keep germination, survival and sell-through separate. The sales target is the number of plants to sell. The 85% sell-through rate only grosses up production.
- Cost every saleable plant, not only the plants sold.
- Count purchased seed once. Equipment is capital and excludes seed, media and reusable tubes or pots. Earlier notes rounded longer lists to about $2,490, $6,800 and $7,730. Those figures are rough references. The planner uses the sum of the lines that are currently included.
- Split owner time (economic, not cash) from hired wages (cash).
- Leave household rent of $450 a week out of the business. A business rent allocation defaults to $0.
- Show revenue, production, contribution, cash operating profit before and after owner labour, cash after equipment, break-even or a plain statement that break-even is impossible, and the gap to a $40,000 cash-profit goal.
- Compare scenarios, save and rename and delete browser copies, and import or export JSON and CSV.

The species list, sowing calendar, supplier links and the November 2026 prices are reference data inside the app. They are not private scenario rows, and the database is not seeded with them.

## Accounts

Production builds read `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. See [docs/SUPABASE.md](docs/SUPABASE.md) and `.env.example`. Never put a service role key in the frontend.

The app can sign in an existing owner. It does not offer registration, and signing up elsewhere does not add anyone to the allowlist. Owner setup is still pending, so cloud save is not working.

## Hosting

See [docs/HOSTING.md](docs/HOSTING.md). Hash routes and base `/native-nursery/` match `https://precis60.github.io/native-nursery/` after the GitHub Actions deploy on `main`.

The economic identities are in [docs/MODEL.md](docs/MODEL.md).
