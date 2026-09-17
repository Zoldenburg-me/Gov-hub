# [DRAFT] Proposal to Shutter DAO 0x36: Fund Gov-Hub — a governance hub built on Shutter, for Shutter

> Draft for the Shutter Forum (shutternetwork.discourse.group), targeting the
> Shutter Champions program / a Melee round slate or a standalone Snapshot +
> Decent proposal. Numbers and terms below are a starting point for
> negotiation, not final.

## Summary

Gov-Hub is a unified governance dashboard for Shutter DAO 0x36 that also
**dogfoods the Shutter API**: it ships *Sealed Positions*, timelock-encrypted
governance commitments powered by the Keyper network. We ask the DAO to fund
a 3-month pilot to harden it, host it, and co-design the sealed-commitment
workflows delegates actually need.

## Problem

- DAO 0x36 governance is split across the Forum (discussion), Snapshot
  (shielded off-chain voting) and Decent (on-chain execution). There is no
  single place to see what's live, what passed quorum, and what executes next.
- Shutter markets threshold encryption to 600+ DAOs via Snapshot shielded
  voting, but the DAO's *own* day-to-day tooling showcases none of it beyond
  the ballot box.
- Governance-relevant information (delegate stances, embargoed drafts, grant
  review scores) still circulates in plaintext, so anchoring, bandwagon
  effects and front-running of announcements persist outside the vote itself.

## What we've already built (working v0.1, open source)

Repo: https://github.com/Zoldenburg-me/Gov-hub

1. **Live proposal dashboard** for `shutterdao0x36.eth` — state, quorum
   progress, vote counts, shielded-voting badges, deep links to Forum /
   Snapshot / Decent / treasury.
2. **Sealed Positions** — in-browser threshold encryption via
   `@shutter-network/shutter-sdk` + the public Shutter API:
   delegates commit to a position that provably cannot be opened (by anyone)
   before a chosen reveal time, and that anyone can verify and decrypt after.
   Zero backend; commitments are portable JSON.

This is, to our knowledge, the first third-party product built on the Shutter
API's timelock encryption outside Shutter's own examples — exactly the
ecosystem adoption the API launch called for.

## Proposed pilot (3 months)

| Milestone | Deliverable |
| --- | --- |
| M1 | Hosted deployment (custom domain), live-API hardening, forum feed integration, proposal ↔ forum-thread cross-linking |
| M2 | Sealed delegate positions per proposal: browsable public registry, one-click "post commitment to forum", auto-reveal at vote close |
| M3 | Sealed-bid grant reviews for Shutter Champions / Melee rounds (reviewers commit scores before deliberation), on-chain (Decent/Safe) status + treasury view |

All code remains open source. The DAO gets a governance surface that is also
a permanent, public demo of the Shutter API — a sales asset for the 600+
Snapshot DAOs Shutter already reaches.

## Ask

- **Funding:** 30,000 USDC (10k/month, milestone-gated) + a discretionary
  5,000 USDC bug-bounty/audit budget for the encryption paths.
- **From the DAO:** a named liaison, feedback from 3–5 active delegates, and
  inclusion of the pilot in one Melee round as a case study.

Payment via the DAO's standard mechanisms (Snapshot signal → Decent on-chain
execution). We are open to part-SHU compensation with a vesting schedule.

## Why us

We ship fast and in the open: v0.1 (dashboard + working threshold-encryption
feature, typed, building clean) was built and published before asking for
anything. Funding buys hardening, hosting and co-design — not a promise.

## Success metrics

- ≥ 50 % of active delegates using Gov-Hub monthly (self-reported + traffic).
- ≥ 20 sealed commitments posted in real governance threads during the pilot.
- One Melee/Champions round run with sealed-bid reviews end-to-end.
- At least one additional DAO onboarded as a Gov-Hub tenant (pipeline for
  Shutter API adoption beyond 0x36).
