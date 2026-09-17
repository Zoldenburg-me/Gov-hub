/**
 * Farcaster adapter, via the Neynar API (https://docs.neynar.com). Farcaster
 * is the crypto-native choice for a public DAO answerbot: mentions arrive as
 * casts tagging the bot's account, and replies are casts posted with a
 * managed signer.
 *
 * Endpoint shapes are per Neynar's v2 API at the time of writing and are
 * normalized defensively — verify against the live API on first deploy.
 */

import type { PublicMention, SocialAdapter } from "./adapter.ts";

export type FarcasterAdapterOptions = {
  /** Neynar API key. */
  apiKey: string;
  /** The bot account's fid, whose mentions are polled. */
  fid: number;
  /** Neynar managed signer for posting casts as the bot. */
  signerUuid: string;
  apiBase?: string;
};

type NeynarNotification = {
  type?: string;
  cast?: {
    hash?: string;
    thread_hash?: string;
    text?: string;
    author?: { username?: string; fid?: number };
  };
};

export function createFarcasterAdapter(options: FarcasterAdapterOptions): SocialAdapter {
  const apiBase = options.apiBase ?? "https://api.neynar.com";
  const headers = { "x-api-key": options.apiKey, "Content-Type": "application/json" };

  return {
    platform: "farcaster",

    async pollMentions(): Promise<PublicMention[]> {
      const url = `${apiBase}/v2/farcaster/notifications?fid=${options.fid}&type=mentions&limit=25`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Neynar notifications failed: HTTP ${res.status}`);
      const json = (await res.json()) as { notifications?: NeynarNotification[] };
      const mentions: PublicMention[] = [];
      for (const notification of json.notifications ?? []) {
        const cast = notification.cast;
        if (cast?.hash === undefined || cast.text === undefined) continue;
        mentions.push({
          externalId: cast.hash,
          threadId: cast.thread_hash ?? cast.hash,
          author: cast.author?.username ?? `fid:${cast.author?.fid ?? "unknown"}`,
          text: cast.text,
        });
      }
      return mentions.reverse(); // newest last
    },

    async reply(inReplyTo, text) {
      const res = await fetch(`${apiBase}/v2/farcaster/cast`, {
        method: "POST",
        headers,
        body: JSON.stringify({ signer_uuid: options.signerUuid, text, parent: inReplyTo }),
      });
      if (!res.ok) throw new Error(`Neynar cast failed: HTTP ${res.status}`);
      const json = (await res.json()) as { cast?: { hash?: string } };
      return { externalId: json.cast?.hash ?? "unknown" };
    },
  };
}
