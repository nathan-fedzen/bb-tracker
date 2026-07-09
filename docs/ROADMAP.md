# Roadmap

Staged build order. Each stage has a concrete, testable deliverable — don't
start the next stage until the current one's "Done when" is actually true,
not just "code written." Hardest/most uncertain work (extraction quality) is
front-loaded so it fails fast if it's not going to work, before any
infra is built around it.

## Stage 0 — Foundations

Already mostly done via the initial scaffold.

- [x] pnpm monorepo (`apps/web`, `apps/worker`, `packages/shared`)
- [x] Shared types (`Houseguest`, `ExtractedInteraction`, `TweetExtraction`, `RawTweet`)
- [x] `.env.example` with required vars
- [ ] `.nvmrc` pinned to a specific Node LTS version
- [ ] Repo pushed to GitHub (done — `nathan-fedzen/bb-tracker`)

**Done when:** `pnpm install` succeeds from a clean clone with no manual fixes.

---

## Stage 1 — Prove extraction quality (no infra)

The single highest-risk assumption in this project: that an LLM can reliably
turn narrated BB-update tweets into structured speaker/target/type data.
Prove this with a spreadsheet and a script before writing any pipeline code.

- [ ] Manually collect 50–100 real tweets from a past season (a few different
      update accounts, mix of 2-person scenes, group scenes, pure gossip,
      non-interaction status tweets)
- [ ] Hand-label expected output for each (speaker, target, type, sentiment)
      — this is your eval set
- [ ] Write the extraction prompt against `packages/shared/src/types.ts`'
      `TweetExtraction` shape, call Claude Haiku 4.5 with a small test script
      (no DB, no queue — just tweets in, JSON out)
- [ ] Score against the hand-labeled set: % correct speaker/target
      identification, % correct type classification
- [ ] Decide a quality bar (e.g. "good enough" = >85% correct on
      speaker/target, type mistakes are more tolerable)

**Done when:** you have a number — e.g. "82% of hand-labeled tweets extracted
correctly" — not a vibe. If quality is bad, iterate on the prompt (roster
grounding, few-shot examples, rolling context) here, before Stage 3+ exist to
get in the way.

---

## Stage 2 — Data source + schema

- [ ] Evaluate 2–3 third-party tweet reader providers against current
      pricing (rates move — recheck, don't trust the numbers in
      `docs/ARCHITECTURE.md` blindly) — pick one
- [ ] Sign up, get API key, confirm you can pull a known account's recent
      tweets with a `curl`/Postman call
- [ ] Create Supabase project, get connection string + keys into `.env`
- [ ] Write Postgres schema/migration: `houseguests`, `tweets`,
      `interactions` tables matching the shared types
- [ ] Apply migration, confirm tables exist via Supabase dashboard or `psql`

**Done when:** you can manually `INSERT` a fake row into each table and
query it back.

---

## Stage 3 — Ingestion (1–2 accounts)

- [ ] `apps/worker`: fetch-tweets script using the chosen provider's API,
      one tracked account
- [ ] Cursor/dedup logic (`since_id` or timestamp) so re-runs don't
      double-insert
- [ ] Write raw tweets into the `tweets` table
- [ ] Run manually against a live account, confirm new tweets land in
      Postgres with `processed = false`

**Done when:** running the script twice in a row only inserts new tweets
the second time (zero on an empty diff). Expand to the full 5 accounts once
this works for 1–2.

---

## Stage 4 — Extraction worker (wired to real data)

- [ ] Port the Stage 1 prompt into `apps/worker` as a batch job: pull N
      unprocessed tweets, batch them into one prompt (with roster + rolling
      context per `docs/ARCHITECTURE.md`), call Haiku, parse
      `TweetExtraction[]` back out
- [ ] Write results into `interactions`, mark source tweets `processed = true`
- [ ] Handle malformed/unparseable LLM output without crashing the batch
      (skip + log, don't silently drop or hard-fail the whole run)

**Done when:** running the job against the real tweets from Stage 3
produces `interactions` rows you'd actually recognize as correct on manual
spot-check — same quality bar as Stage 1, now on the real pipeline.

---

## Stage 5 — Graph component (static data)

Build this against a fixed seed dataset, not the live pipeline — keeps it
testable in isolation.

- [ ] `apps/web`: Next.js shell, Tailwind wired up
- [ ] Seed script/fixture: a JSON file of fake houseguests + interactions
- [ ] PixiJS canvas + d3-force layout rendering nodes (houseguests) and
      edges (interactions), per `[[bb-tracker-graph-stack]]` decision:
      d3-force for physics, PixiJS for rendering
- [ ] Basic interaction: hover a node to highlight its edges

**Done when:** loading the page against the seed fixture renders a
recognizable, stable force-directed graph — no live data needed yet.

---

## Stage 6 — Go live

- [ ] Wire the frontend to real Supabase data (replace the fixture) —
      graph renders from actual `interactions` rows
- [ ] Supabase Realtime subscription: new `interactions` rows push into the
      graph without a page refresh
- [ ] Scheduling: implement the hybrid polling cadence from
      `docs/ARCHITECTURE.md` (frequent during peak hours, sparse off-peak) —
      cron job (Vercel Cron / GitHub Actions / Supabase scheduled function)
      triggers Stage 3 ingestion → Stage 4 extraction in sequence
- [ ] Tweet feed panel (chronological list) alongside the graph, not just
      the graph alone

**Done when:** you can leave the site open, wait for the next scheduled
run, and watch a new interaction appear on the graph without touching
anything manually.

---

## Stage 7 — Polish

- [ ] Roster admin UI — update houseguests/aliases without redeploying
      (needed every new season anyway)
- [ ] Filters (by houseguest, by interaction type, by date range)
- [ ] Timeline scrubber to replay a day's conversations
- [ ] Visual polish on the graph (recency glow/fade, pulse on new edges —
      the payoff for the PixiJS choice)

**Done when:** you'd be comfortable sending the link to another BB fan
without walking them through it first.

---

## Stage 8 — Deploy

- [ ] `apps/web` → Vercel
- [ ] `apps/worker` cron → whichever scheduler was picked in Stage 6
- [ ] Confirm env vars/secrets are set in each hosting provider, not just
      local `.env`
- [ ] Smoke test against production Supabase, not a local/dev instance

**Done when:** the public URL shows live data end-to-end, unattended, for
at least one full scheduled cycle.
