// Shared types used by both apps/web and apps/worker.

export interface Houseguest {
  id: string;          // "xavier"
  name: string;         // "Xavier"
  aliases: string[];    // ["X", "Xman"]
  season: number;
  active: boolean;
}

export type InteractionType =
  | "game_talk"      // strategy, votes, targets
  | "alliance_talk"  // explicit alliance/final-2 deals
  | "showmance"      // romantic/flirtatious
  | "conflict"       // argument, callout, tension
  | "gossip"         // talking ABOUT a third party
  | "bonding"        // social/emotional, non-game
  | "other";

export type Sentiment = "positive" | "negative" | "neutral" | "mixed";

export interface ExtractedInteraction {
  speaker_id: string | null;   // null if narrator/unclear
  target_id: string | null;    // null if group scene
  group_ids?: string[];        // 3+ participants, if applicable
  type: InteractionType;
  sentiment: Sentiment;
  summary: string;             // <=12 words, paraphrased, never verbatim
  mentioned_ids?: string[];    // referenced but not active participants
  confidence: number;          // 0-1
}

export interface TweetExtraction {
  tweet_id: string;
  has_interaction: boolean;    // false = pure status/event tweet
  interactions: ExtractedInteraction[];
}

export interface RawTweet {
  id: string;
  source_account: string;
  text: string;
  posted_at: string;   // ISO timestamp
  processed: boolean;
}
