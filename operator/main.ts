/**
 * Gov-Hub's Concorde deployment: the shared agent for Shutter DAO 0x36.
 *
 * Gov-Hub is the Operator in Concorde's sense — the party every member
 * trusts to run and configure the shared agent. This entry point wires:
 *
 *  - Users + Password Auth: DAO delegates, seeded from DELEGATES.
 *  - Messenger + HTTP Channel: member Q&A over one durable, shared log.
 *  - Signatures + Decisions: the agent's verifiable commitment log.
 *  - Scheduler: the daily governance digest and sealed-commitment reveals.
 *  - Sealed Commitments (ours): Decisions whose content is Shutter
 *    timelock-encrypted until a chosen reveal time.
 */

import { createPrivateKey } from "node:crypto";
import { readFileSync } from "node:fs";
import { createDecisions } from "@shutter-network/concorde/decisions";
import { createGateway } from "@shutter-network/concorde/gateway";
import { createHttpChannel } from "@shutter-network/concorde/http-channel";
import {
  createMessenger,
  type MessageRecord,
  messageReceivedKind,
} from "@shutter-network/concorde/messenger";
import { createPasswordAuth } from "@shutter-network/concorde/password-auth";
import { createPiRuntime } from "@shutter-network/concorde/pi";
import {
  createScheduler,
  type ScheduleFiredRecord,
  scheduleFiredKind,
} from "@shutter-network/concorde/scheduler";
import { type Prompt, type SignalHandler, templateHandler } from "@shutter-network/concorde/signals";
import { createSignatures } from "@shutter-network/concorde/signatures";
import { createUsers } from "@shutter-network/concorde/users";
import {
  createSealedCommitments,
  type SealedRevealScheduleData,
  sealedRevealSchedulePrefix,
} from "./src/sealed-commitments.ts";
import { createShutterClient } from "./src/shutter.ts";
import { fetchProposalsForDigest } from "./src/snapshot.ts";

const signingKey = createPrivateKey(readFileSync(process.env.SIGNING_KEY_FILE!));

const snapshotSpace = process.env.SNAPSHOT_SPACE ?? "shutterdao0x36.eth";
const digestCron = process.env.DIGEST_CRON ?? "0 9 * * *";
const shutterApiBase =
  process.env.SHUTTER_API_BASE ?? "https://shutter-api.shutter.network/api";

/** "name:password,name:password" — the delegates this deployment serves. */
const delegates = (process.env.DELEGATES ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter((entry) => entry !== "")
  .map((entry) => {
    const [name, password] = entry.split(":");
    if (name === undefined || password === undefined || password === "") {
      throw new Error(`DELEGATES entry ${JSON.stringify(entry)} is not name:password`);
    }
    return { name, password };
  });

const tokenTtl = 30 * 24 * 60 * 60 * 1000;
const digestScheduleName = "governance-digest";

const runtime = createPiRuntime({
  image: process.env.AGENT_IMAGE!,
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
    AGENT_SERVER_URL: process.env.AGENT_SERVER_URL!,
  },
  networks: [process.env.AGENT_NETWORK!],
  mounts: {
    runtimeDir: process.env.RUNTIME_DIR_HOST!,
    entries: [
      { agentPath: "/workspace", path: "state/workspace" },
      { agentPath: "/home/agent/.pi/agent", path: "state/agent" },
      { agentPath: "/workspace/AGENTS.md", path: "AGENTS.md", readOnly: true },
      { agentPath: "/home/agent/.pi/agent/settings.json", path: "settings.json", readOnly: true },
    ],
  },
});

const gateway = createGateway({
  databaseUrl: process.env.DATABASE_URL!,
  runtime,
  publicListen: { host: process.env.PUBLIC_HOST!, port: Number(process.env.PUBLIC_PORT) },
  agentListen: { host: process.env.AGENT_HOST!, port: Number(process.env.AGENT_PORT) },
  extend: ({ db, agentServer, publicServer, worker }) => {
    const users = createUsers({ db, agentServer, publicServer });
    const passwordAuth = createPasswordAuth({ db, users, publicServer, tokenTtl });
    const signatures = createSignatures({ signingKey, agentServer, publicServer });
    const decisions = createDecisions({ db, signatures, agentServer, publicServer });
    const messenger = createMessenger({ db, users, worker, agentServer });
    const httpChannel = createHttpChannel({ db, messenger, publicServer });
    const scheduler = createScheduler({ db, worker, agentServer });
    const sealedCommitments = createSealedCommitments({
      db,
      decisions,
      scheduler,
      agentServer,
      shutter: createShutterClient(shutterApiBase),
    });
    return {
      users,
      passwordAuth,
      signatures,
      decisions,
      messenger,
      httpChannel,
      scheduler,
      sealedCommitments,
    };
  },
  handlers: ({ sealedCommitments }) => {
    const scheduleFired: SignalHandler<ScheduleFiredRecord> = {
      async handle(signal): Promise<Prompt[]> {
        const { scheduleName } = signal.payload;

        if (scheduleName === digestScheduleName) {
          const proposals = await fetchProposalsForDigest(snapshotSpace);
          return [
            {
              session: "governance-digest",
              text: [
                `It is time for the daily governance digest for ${snapshotSpace}.`,
                `Here is the current proposal state, fetched moments ago:`,
                JSON.stringify(proposals, null, 2),
                `Compare it with the previous digest in your workspace notes,`,
                `then message every user a short digest: what is newly open,`,
                `what closes within 48 hours (urgent, say so), and what closed`,
                `with which outcome. Shielded proposals ("privacy":"shutter")`,
                `hide tallies while active — never speculate about their`,
                `standing. Update your workspace notes afterwards.`,
              ].join("\n"),
            },
          ];
        }

        if (scheduleName.startsWith(sealedRevealSchedulePrefix)) {
          const revealed = await sealedCommitments.reveal(
            signal.payload.data as SealedRevealScheduleData,
          );
          return [
            {
              session: null,
              text: [
                `A sealed commitment of yours just matured and was revealed on`,
                `the Decision log as Decision #${revealed.seq}. Its plaintext:`,
                revealed.plaintext,
                `Message every user that the commitment is now public,`,
                `quoting the plaintext and naming the Decision number.`,
              ].join("\n"),
            },
          ];
        }

        return [];
      },
    };

    return {
      [messageReceivedKind]: templateHandler<MessageRecord>({
        template: `A message arrived from user {{userId}}. They said:

{{text}}

You are the shared agent of Shutter DAO 0x36. Answer them by sending a
Message addressed to {{userId}} — your final reply here reaches nobody.
Consult your AGENTS.md for who you are and what you may commit to.`,
        session: (signal) => `user_${signal.payload.userId}`,
        data: (signal) => signal.payload,
      }),
      [scheduleFiredKind]: scheduleFired as SignalHandler,
    };
  },
});

await gateway.start();

const { db, users, passwordAuth, scheduler } = gateway.components;

if ((await users.list({ limit: 1 })).length === 0) {
  await db.tx(async (tx) => {
    for (const delegate of delegates) {
      const user = await users.create(tx);
      await users.setAttributes(tx, user.id, { name: delegate.name });
      await passwordAuth.setPassword(tx, user.id, delegate.password);
    }
  });
}

await scheduler.schedule({
  name: digestScheduleName,
  spec: { kind: "cron", expr: digestCron, tz: "UTC" },
});

for (const user of await users.list()) {
  console.log(`user ${user.id} ${JSON.stringify(user.attributes)}`);
}

for (const stopping of ["SIGINT", "SIGTERM"] as const) {
  process.once(stopping, () => void gateway.stop());
}
