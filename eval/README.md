# Extraction eval set (Stage 1)

Hand-labeled tweets used to score extraction prompt quality before any
pipeline code exists. See `docs/ROADMAP.md` Stage 1.

## Collecting tweets (`tweets.csv`)

- Copy tweet text **verbatim** — no cleanup/paraphrasing. Typos, all-caps,
  BB-specific shorthand (HOH, POV, "SR" for storage room, etc.) are exactly
  what the real prompt has to handle.
- Grab **contiguous runs**, not scattered samples — 5-10 tweets in a row
  from the same account, across a few different accounts/moments. Rolling
  context (pronoun/scene continuity across consecutive tweets) can't be
  tested from random single tweets.
- Include a mix: 2-person scenes, group scenes, gossip (target discussed
  but not present), and pure status/event tweets with no interaction at all
  (`expected_has_interaction = false`) — the model needs to get "nothing
  happened here" right too, not just classify interactions.
- No screenshots — paste real text. It matches how the real pipeline
  receives tweets (raw text from the API), and skips an OCR/retyping step
  that would just introduce transcription errors of its own.

## Columns

| Column | Notes |
|---|---|
| `tweet_id` | Real tweet ID if available, else any unique string |
| `source_account` | Handle, no `@` |
| `posted_at` | ISO timestamp — needed to preserve real ordering for context tests |
| `text` | Verbatim tweet text |
| `expected_has_interaction` | `true`/`false` |
| `expected_speaker` | Houseguest id (lowercase, e.g. `xavier`), or blank if narrator/unclear |
| `expected_target` | Houseguest id, or blank if group scene |
| `expected_type` | One of: `game_talk`, `alliance_talk`, `showmance`, `conflict`, `gossip`, `bonding`, `other` (see `packages/shared/src/types.ts`) |
| `expected_sentiment` | One of: `positive`, `negative`, `neutral`, `mixed` |
| `expected_group_ids` | Pipe-separated houseguest ids for 3+ participant scenes, else blank |
| `notes` | Anything worth flagging when reviewing scores (ambiguous case, sarcasm, etc.) |

If a single tweet has two distinct interactions (rare — e.g. two separate
side conversations mentioned in one tweet), add a second row with the same
`tweet_id`.

## Next step

Once this has 50-100 rows: write a converter script (CSV → JSON matching
`TweetExtraction`) and the scoring script that calls Haiku and diffs
predicted vs. expected. Not built yet — do this once real data exists here.
