/**
 * What the Herald creates in a database: the `mentions` and `replies` tables
 * in the `govhub_herald` PostgreSQL schema. Prefixed like the framework's own
 * schemas, because the deployment installs into a database it does not own.
 */

import { pgSchema, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const heraldSchema = pgSchema("govhub_herald");

/**
 * Every public mention the Herald has seen, whichever platform it watches.
 * The unique constraint is the dedupe: a poll window that overlaps a
 * previous one inserts nothing and emits nothing.
 */
export const mentions = heraldSchema.table(
  "mentions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: text("platform").notNull(),
    externalId: text("external_id").notNull(),
    threadId: text("thread_id").notNull(),
    author: text("author").notNull(),
    text: text("text").notNull(),
    seenAt: timestamp("seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.platform, table.externalId)],
);

/**
 * Every public reply the agent posted through the Gateway. The durable
 * record of the agent's public voice, in the spirit of the Message log:
 * what was said is recorded here whatever the platform later does with it.
 */
export const replies = heraldSchema.table("replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: text("platform").notNull(),
  externalId: text("external_id").notNull(),
  inReplyTo: text("in_reply_to").notNull(),
  text: text("text").notNull(),
  postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow(),
});
