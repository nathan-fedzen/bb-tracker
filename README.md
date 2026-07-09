# BB Tracker

Tracks Big Brother live-feed update accounts in real time, extracts who's
talking to whom using an LLM, and renders the in-house social graph as it
develops.

## Structure (pnpm monorepo)

```
apps/
  web/      Next.js frontend — tweet feed + PixiJS/d3-force relationship graph
  worker/   Ingestion + extraction pipeline (polling, batching, LLM calls)
packages/
  shared/   Shared TS types used by both apps (roster, interaction schema)
docs/
  ARCHITECTURE.md   Design decisions and rationale
```

## Stack

- **Frontend:** Next.js + TypeScript, PixiJS + d3-force for the live graph, Tailwind
- **Worker:** Node/TypeScript, scheduled polling (hybrid: frequent during peak
  live-feed hours, sparse off-peak), batched LLM extraction calls
- **Data source:** third-party tweet reader (cost-evaluated vs. official X API
  — see docs/ARCHITECTURE.md)
- **LLM:** Claude Haiku 4.5 via Anthropic API, batched + prompt-cached
- **DB:** Postgres via Supabase (also provides realtime change subscriptions
  to push new interactions to the frontend)

## Setup

```bash
pnpm install
cp .env.example .env   # fill in credentials
pnpm dev:web            # frontend
pnpm dev:worker         # ingestion/extraction pipeline
```

## Status

Scaffold only — no implementation yet. See docs/ARCHITECTURE.md for the
design this is built against.
