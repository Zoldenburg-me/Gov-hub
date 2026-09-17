/**
 * The seam between the Herald and one social platform: fetch recent mentions
 * of the bot's account, and post one public reply. Everything else — dedupe,
 * Signals, the audit trail, the agent's route — is the Herald's and does not
 * change per platform.
 */

export type PublicMention = {
  /** The platform's own id for the mentioning post. */
  externalId: string;
  /** The conversation/thread the post belongs to (falls back to externalId). */
  threadId: string;
  /** Platform handle or fid of the author, for the prompt only. */
  author: string;
  text: string;
};

export type SocialAdapter = {
  readonly platform: string;
  /**
   * Recent mentions, newest last. The adapter picks its own window; the
   * Herald dedupes, so overlap is fine and gaps are the only real cost.
   */
  pollMentions(): Promise<PublicMention[]>;
  /** Post a public reply; answers with the platform's id for the new post. */
  reply(inReplyTo: PublicMention["externalId"], text: string): Promise<{ externalId: string }>;
};
