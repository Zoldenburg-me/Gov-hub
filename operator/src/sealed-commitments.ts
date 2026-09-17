/**
 * Sealed Commitments: a third-party Component that gives a shared agent
 * tamper-evident forward commitments, by combining Concorde's Decision log
 * with Shutter timelock encryption.
 *
 * The agent calls `POST /sealed-commitments` on the Agent server with a
 * statement and a reveal time. This Component seals the statement with the
 * Keyper network, publishes a Decision carrying only the ciphertext (so the
 * commitment is public and signed while its content stays unreadable by
 * anyone, Operator included, until the reveal time), and arms a one-shot
 * Schedule. When that Schedule fires, `reveal` fetches the released key,
 * decrypts, and publishes the plaintext as a second Decision that names the
 * first — verifiable end to end by anybody holding the agent's public key.
 */

import type { Db } from "@shutter-network/concorde/db";
import type { Decisions } from "@shutter-network/concorde/decisions";
import type { Component } from "@shutter-network/concorde/gateway";
import type { Scheduler } from "@shutter-network/concorde/scheduler";
import type { FastifyInstance } from "fastify";
import type { Hex, ShutterClient } from "./shutter.ts";

export const sealedRevealSchedulePrefix = "sealed-reveal:";

export type SealedCommitmentStatement = {
  typ: "sealed-commitment";
  identity: Hex;
  eonKey: Hex;
  ciphertext: Hex;
  revealAt: string;
};

export type SealedRevealStatement = {
  typ: "sealed-reveal";
  identity: Hex;
  commitmentSeq: number;
  plaintext: string;
};

export type SealedRevealScheduleData = {
  identity: Hex;
  ciphertext: Hex;
  commitmentSeq: number;
};

export type SealedCommitmentsOptions = {
  db: Db;
  decisions: Decisions;
  scheduler: Scheduler;
  shutter: ShutterClient;
  agentServer: { fastify: FastifyInstance };
};

export type SealedCommitments = Component & {
  /**
   * Seal a statement and publish the commitment Decision; answers with the
   * Decision's seq and the Shutter identity. Also arms the reveal Schedule.
   */
  commit(statement: string, revealAt: Date): Promise<{ seq: number; identity: Hex }>;
  /** Decrypt a matured commitment and publish the reveal Decision. */
  reveal(data: SealedRevealScheduleData): Promise<{ seq: number; plaintext: string }>;
};

export function createSealedCommitments(options: SealedCommitmentsOptions): SealedCommitments {
  const { db, decisions, scheduler, shutter } = options;

  async function commit(statement: string, revealAt: Date) {
    const sealed = await shutter.seal(statement, Math.floor(revealAt.getTime() / 1000));
    const body: SealedCommitmentStatement = {
      typ: "sealed-commitment",
      identity: sealed.identity,
      eonKey: sealed.eonKey,
      ciphertext: sealed.ciphertext,
      revealAt: revealAt.toISOString(),
    };
    const published = await db.tx((tx) => decisions.publish(tx, JSON.stringify(body)));
    const data: SealedRevealScheduleData = {
      identity: sealed.identity,
      ciphertext: sealed.ciphertext,
      commitmentSeq: published.seq,
    };
    await scheduler.schedule({
      name: `${sealedRevealSchedulePrefix}${sealed.identity}`,
      spec: { kind: "once", at: revealAt.toISOString() },
      data,
    });
    return { seq: published.seq, identity: sealed.identity };
  }

  async function reveal(data: SealedRevealScheduleData) {
    const plaintext = await shutter.reveal(data);
    const body: SealedRevealStatement = {
      typ: "sealed-reveal",
      identity: data.identity,
      commitmentSeq: data.commitmentSeq,
      plaintext,
    };
    const published = await db.tx((tx) => decisions.publish(tx, JSON.stringify(body)));
    return { seq: published.seq, plaintext };
  }

  options.agentServer.fastify.post("/sealed-commitments", async (request, reply) => {
    const body = request.body as { statement?: unknown; revealAt?: unknown } | null;
    const statement = typeof body?.statement === "string" ? body.statement.trim() : "";
    const revealAt = typeof body?.revealAt === "string" ? new Date(body.revealAt) : null;
    if (statement === "" || revealAt === null || Number.isNaN(revealAt.getTime())) {
      return reply
        .status(400)
        .send({ error: "expected { statement: string, revealAt: ISO-8601 string }" });
    }
    if (revealAt.getTime() < Date.now() + 60_000) {
      return reply.status(400).send({ error: "revealAt must be at least a minute in the future" });
    }
    const outcome = await commit(statement, revealAt);
    return reply.status(201).send({ ...outcome, revealAt: revealAt.toISOString() });
  });

  return {
    async start() {},
    async stop() {},
    commit,
    reveal,
  };
}
