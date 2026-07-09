# Architecture

## Data flow

Tracked accounts → Poller (worker) → Postgres (raw tweets) → Extraction
batch job (Claude Haiku) → Postgres (interactions/edges) → Supabase
Realtime → Frontend (feed + PixiJS graph)

## Key decisions

**Ingestion cadence:** hybrid polling rather than true real-time streaming.
Frequent (~1-2 min) during known live-feed peak hours, sparse (hourly)
off-peak. Avoids the cost/complexity of an always-on queue + websocket
layer while still feeling live when it matters. Revisit if product needs
change.

**Data source:** evaluate official X pay-per-use API against third-party
tweet readers before committing — at low volume (a few thousand
tweets/month) third-party readers are roughly 10-30x cheaper, but verify
current rates directly, this space moves fast. Threads was considered but
the official API only exposes the authenticated app's own account, not
arbitrary public accounts — would require the same class of third-party
reader as X, not a free official path.

**Self-hosted scraper:** considered and rejected for now. X's anti-bot
stack (Cloudflare Turnstile, login walls, JS rendering, frequently-rotated
internal endpoints) makes DIY scraping a high-maintenance, legally murkier
path for marginal savings over a third-party reader at this volume.

**Extraction:** batched LLM calls (not per-tweet), Claude Haiku 4.5, with
the houseguest roster + system prompt cached (`cache_control: ephemeral`).
Rolling context (last few tweets per account) passed alongside target
tweets so pronoun/scene continuity survives across consecutive tweets.
Full schema in packages/shared/src/types.ts.

**Interaction types:** direct interactions (speaker/target both present)
vs. mentions/gossip (target discussed but not present) are stored as
distinct categories, not collapsed — the graph should render these
differently (e.g. solid vs. dashed edges) rather than filtering mentions
out.

**Storage:** plain Postgres, no graph DB. An `interactions` edge table is
sufficient at this scale and far simpler to operate than Neo4j etc.

## Rough cost estimate (5 accounts, ~150 tweets/day)

| Component | Estimate |
|---|---|
| Ingestion (third-party reader) | ~$1-9/mo |
| Ingestion (official X API) | ~$22/mo |
| LLM extraction (Haiku, batched) | ~$2-5/mo |
| Hosting (Supabase + Vercel free tiers) | $0 until scale requires upgrade |

## Open items

- [ ] Postgres schema (houseguests, tweets, interactions)
- [ ] PixiJS + d3-force graph component
- [ ] Roster admin UI (update houseguests/aliases per season)
- [ ] Pick and integrate a specific tweet data provider
