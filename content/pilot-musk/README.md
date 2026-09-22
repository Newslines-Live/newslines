# Musk event-generation pilot (Phase 0)

Source-grounded generation: **facts first**, LLM writes original Newslines prose, validators flag issues. Does **not** auto-write `data/seed.json`.

## Setup

1. Install deps (`zod` is required; already in package.json after install).
2. Set env (`.env.local` or shell):

```bash
OPENAI_API_KEY=sk-...
# optional:
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_MODEL=gpt-4o-mini
```

3. Generate from a case pack:

```bash
npm run generate:event -- --case content/pilot-musk/cases/statement-x-paste.json
```

Or ad-hoc:

```bash
npm run generate:event -- --topic elon-musk --facts-file facts.txt --url "https://example.com/a"
npm run generate:event -- --topic elon-musk --text-file post.txt --url "https://x.com/..."
```

Flags:

| Flag | Meaning |
|------|---------|
| `--case path` | Pilot case JSON |
| `--topic slug` | Default `elon-musk` |
| `--url` | Repeatable source URLs |
| `--text-file` | Pasted primary text |
| `--facts-file` | One fact per line |
| `--skip-extract` | Don't call LLM for fact extract (use case facts only) |
| `--skip-dupe` | Skip seed near-dupe scan |
| `--dry-run` | Build facts + print prompts only (no generation LLM) |
| `--out dir` | Output directory (default `content/pilot-musk/out`) |

## Outputs

Each run writes:

- `content/pilot-musk/out/<id-or-slug>.json` — full generated event + validation
- stdout scorecard (errors hard-fail exit 1; warnings exit 0)

## Scorecard (human)

Mark pass only if all critical checks are met (see plan). **Pass gate:** ≥80% of case pack with only minor polish, or 5 consecutive clean accepts.

## Gold few-shots

`content/pilot-musk/gold/few-shots.json` — style examples only (not test cases).
