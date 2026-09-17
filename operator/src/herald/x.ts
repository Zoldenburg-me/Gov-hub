/**
 * X (Twitter) adapter, via the v2 API. Note the platform costs: reading
 * mentions and posting need a paid API tier, and posting requires a
 * user-context OAuth 2.0 token for the bot account (a plain app bearer
 * token can read but not post).
 *
 * Endpoint shapes are per the X API v2 at the time of writing and are
 * normalized defensively — verify against the live API on first deploy.
 */

import type { PublicMention, SocialAdapter } from "./adapter.ts";

export type XAdapterOptions = {
  /** The bot account's numeric user id, whose mentions are polled. */
  userId: string;
  /** Token for reading mentions (app bearer or user token). */
  readToken: string;
  /** User-context OAuth 2.0 token for posting as the bot. */
  postToken: string;
  apiBase?: string;
};

type XTweet = {
  id?: string;
  text?: string;
  conversation_id?: string;
  author_id?: string;
};

export function createXAdapter(options: XAdapterOptions): SocialAdapter {
  const apiBase = options.apiBase ?? "https://api.x.com";

  return {
    platform: "x",

    async pollMentions(): Promise<PublicMention[]> {
      const url =
        `${apiBase}/2/users/${options.userId}/mentions` +
        `?max_results=25&tweet.fields=conversation_id,author_id`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${options.readToken}` },
      });
      if (!res.ok) throw new Error(`X mentions failed: HTTP ${res.status}`);
      const json = (await res.json()) as { data?: XTweet[] };
      const mentions: PublicMention[] = [];
      for (const tweet of json.data ?? []) {
        if (tweet.id === undefined || tweet.text === undefined) continue;
        mentions.push({
          externalId: tweet.id,
          threadId: tweet.conversation_id ?? tweet.id,
          author: tweet.author_id ?? "unknown",
          text: tweet.text,
        });
      }
      return mentions.reverse(); // newest last
    },

    async reply(inReplyTo, text) {
      const res = await fetch(`${apiBase}/2/tweets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.postToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, reply: { in_reply_to_tweet_id: inReplyTo } }),
      });
      if (!res.ok) throw new Error(`X post failed: HTTP ${res.status}`);
      const json = (await res.json()) as { data?: { id?: string } };
      return { externalId: json.data?.id ?? "unknown" };
    },
  };
}
