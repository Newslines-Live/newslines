# Newslines (Next.js rebuild)

Reader-focused rebuild of [newslines.org](https://newslines.org): topic newslines, The Grid, Musk + McGregor cluster seed. Reuses patterns from UPchart (Supabase clients, shadcn-style UI).

## Quick start

```bash
npm install
npm run dev              # http://localhost:3030 (UPchart uses 3000)
```

`data/seed.json` holds the reader dataset. Prefer the offline archive import (no LLM, no live WP):

```bash
npm run seed:archive               # full dump → data/seed.json (~35k posts)
npm run seed:archive:clusters      # Musk + McGregor clusters only
npm run seed:wikidata-images       # topic images from Wikidata (TypeScript)
```

Requires the training dump at  
`C:\Users\spark\.cursor-tutor\Projects\training\data\wp_summaries.json`  
plus the event-dates SQL export in that project.

Live WordPress re-fetch (Cloudflare may block):

```bash
npm run seed:wp                    # Playwright cluster scrape
# Or run scripts/browser-seed-snippet.js inside a logged-in browser session
```

## Supabase (optional)

1. Create a **new** Supabase project (do not reuse AIMCA/UPchart DBs).
2. Apply `supabase/migrations/20260805180000_newslines_schema.sql`.
3. Copy `.env.example` → `.env.local` and fill keys.
4. `npm run seed:wp:supabase`

Until Supabase is connected, the app reads `data/seed.json`.

## Event generation pilot (Phase 0 — Musk)

Source-grounded CLI to generate Newslines-style events for `elon-musk` (does **not** auto-merge into seed):

```bash
# Requires OPENAI_API_KEY in .env.local
npm run generate:event -- --case content/pilot-musk/cases/statement-x-paste.json
npm run generate:event -- --case content/pilot-musk/cases/claim-frame.json --skip-dupe
```

See [content/pilot-musk/README.md](content/pilot-musk/README.md).

## Routes

- `/` — marketing + clusters
- `/grid` — The Grid
- `/[topic]` — newsline (Latest / Biography)
- `/[topic]/events/[type]` — filtered
- `/[topic]/[event]` — event detail
- `/search`, `/admin`
