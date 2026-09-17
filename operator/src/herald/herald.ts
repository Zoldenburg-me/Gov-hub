/**
 * The Herald: a Producer and Component that gives the shared agent a public
 * voice — the "mention it in public and it answers" pattern — without ever
 * giving the agent direct platform access.
 *
 * Inbound: a polling loop fetches mentions of the bot's account from one
 * SocialAdapter, dedupes them against the `govhub_herald.mentions` table
 * (insert-or-nothing on the platform/externalId unique), and emits a Signal
 * per genuinely new mention, in the same transaction as the row — the same
 * at-most-once contract the framework's own Producers keep.
 *
 * Outbound: the agent posts only through `POST /public-replies` on the Agent
 * server. Every reply is recorded in `govhub_herald.replies` before it is
 * acknowledged, so the durable record of the agent's public voice lives
 * here, whatever the platform later does with the post.
 */

import type { Db } from "@shutter-network/concorde/db";
import type { Component } from "@shutter-network/concorde/gateway";
import type { SignalWorker } from "@shutter-network/concorde/signals";
import type { FastifyInstance } from "fastify";
import type { PublicMention, SocialAdapter } from "./adapter.ts";
import { mentions, replies } from "./schema/index.ts";

export const mentionReceivedKind = "govhub_mention_received";

export type MentionPayload = PublicMention & { platform: string };

export type HeraldOptions = {
  db: Db;
  worker: SignalWorker;
  agentServer: { fastify: FastifyInstance };
  /** null runs the deployment without a public voice: no polling, route 503s. */
  adapter: SocialAdapter | null;
  pollIntervalMs?: number;
};

export type Herald = Component & {
  /** One poll cycle; exposed for tests and for a manual kick. */
  poll(): Promise<number>;
};

export function createHerald(options: HeraldOptions): Herald {
  const { db, worker, adapter } = options;
  const pollIntervalMs = options.pollIntervalMs ?? 60_000;
  let timer: ReturnType<typeof setInterval> | undefined;
  let polling = false;

  async function poll(): Promise<number> {
    if (adapter === null || polling) return 0;
    polling = true;
    try {
      const fetched = await adapter.pollMentions();
      let emitted = 0;
      for (const mention of fetched) {
        await db.tx(async (tx) => {
          const inserted = await tx
            .insert(mentions)
            .values({
              platform: adapter.platform,
              externalId: mention.externalId,
              threadId: mention.threadId,
              author: mention.author,
              text: mention.text,
            })
            .onConflictDoNothing()
            .returning({ id: mentions.id });
          if (inserted.length === 0) return; // seen before — no Signal
          const payload: MentionPayload = { ...mention, platform: adapter.platform };
          await worker.emit(tx, { kind: mentionReceivedKind, payload });
          emitted += 1;
        });
      }
      return emitted;
    } finally {
      polling = false;
    }
  }

  options.agentServer.fastify.post("/public-replies", async (request, reply) => {
    if (adapter === null) {
      return reply.status(503).send({ error: "no social platform is configured" });
    }
    const body = request.body as { inReplyTo?: unknown; text?: unknown } | null;
    const inReplyTo = typeof body?.inReplyTo === "string" ? body.inReplyTo : "";
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (inReplyTo === "" || text === "") {
      return reply.status(400).send({ error: "expected { inReplyTo: string, text: string }" });
    }
    const posted = await adapter.reply(inReplyTo, text);
    await db.tx((tx) =>
      tx.insert(replies).values({
        platform: adapter.platform,
        externalId: posted.externalId,
        inReplyTo,
        text,
      }),
    );
    return reply.status(201).send({ externalId: posted.externalId });
  });

  return {
    async start() {
      if (adapter === null) return;
      timer = setInterval(() => {
        void poll().catch((error) => {
          console.error("herald poll failed:", error);
        });
      }, pollIntervalMs);
    },
    async stop() {
      if (timer !== undefined) clearInterval(timer);
    },
    poll,
  };
}
