# [DRAFT] Proposal to Shutter DAO 0x36: Fund the first production Concorde deployment — a shared agent for the DAO, operated by Gov-Hub

> Draft for the Shutter Forum (shutternetwork.discourse.group), targeting the
> Shutter Champions program / a Melee round slate or a standalone Snapshot +
> Decent proposal. Numbers and terms below are an opening position, not
> final.

## Summary

Shutter published Concorde — the framework for shared agents — and the
thesis behind it. What does not exist yet is a production deployment or a
professional **Operator**, the trusted role Concorde's own design defines.
Gov-Hub proposes to be that Operator, starting with a shared agent for
Shutter DAO 0x36's delegates, and we've already built the deployment:
wired, typechecked against Concorde `0.1.0` source, and extended with a
Shutter-API-powered Component that Concorde itself does not have.

## Problem

- Concorde is strategically important to Shutter (shared agents are the
  agent-economy story for threshold encryption) but has no reference
  deployment, no operator, and no production user.
- DAO 0x36's own governance runs across the Forum, Snapshot and Decent;
  delegates have no shared, neutral assistant with a verifiable record.
- Autonomous agents everywhere have an accountability gap: nothing forces an
  agent's stated intentions to be tamper-evident. Shutter's timelock
  encryption is the exact primitive that closes it — unmonetized so far.

## What we've already built (open source)

Repo: https://github.com/Zoldenburg-me/Gov-hub

1. **A complete Concorde deployment for DAO 0x36** (`operator/`): Users +
   password auth for delegates, Messenger + HTTP channel, Signatures +
   Decisions, Scheduler, a daily governance digest fed by live Snapshot
   data, and Docker Compose for the whole stack.
2. **The Sealed Commitments Component** — to our knowledge the first
   third-party Concorde Component anywhere: the agent publishes Decisions
   whose content is timelock-encrypted by the Keyper network, then
   automatically decrypted and republished at reveal time. Signed ciphertext
   now, verifiable plaintext later; nobody, Operator included, can open it
   early. This is "tamper-evident autonomy," and only Shutter can sell it.
3. **The Herald** — a public voice for the agent: mention the DAO's account
   on Farcaster or X and it answers in the thread, Gateway-mediated and
   audit-logged. Asked to predict an open vote, it publishes a *sealed
   forecast* (Shutter-encrypted, auto-revealed at vote close) instead of an
   opinion — a public bot that provably cannot steer the votes it comments
   on. Growth surface for the DAO, standing demo for Shutter.
4. **A public governance dashboard** (`web/`): live `shutterdao0x36.eth`
   proposals, shielded-voting state, and a browser demo of Shutter sealed
   positions.

## Proposed pilot — three months

| Milestone | Deliverable |
| --- | --- |
| M1 | Hosted production deployment for DAO 0x36 delegates (custom domain, monitoring, backups); onboarding of 5–10 delegates; hardening against live Shutter API + Concorde head. |
| M2 | Sealed-commitment workflows in real governance: embargoed delegate positions, agent pre-commitments before scheduled actions; public verification page on the dashboard. |
| M3 | A Champions/Melee round assisted by the agent with sealed-bid reviews (scores committed before deliberation, revealed after); Operator playbook published so other DAOs can be onboarded. |

Everything stays open source. Shutter gets the reference Concorde
deployment it needs, run by a named Operator, generating Shutter API volume
and a reusable sales story for every DAO Shutter already reaches through
Snapshot shielded voting.

## Ask

- **36,000 USDC** — 12k/month for three months, milestone-gated, via the
  DAO's standard Snapshot → Decent execution path. Covers operation
  (hosting, monitoring, model costs) and development.
- **5,000 USDC** discretionary audit/bug-bounty budget for the encryption
  paths and the Gateway.
- A named DAO liaison, 5–10 delegates willing to use the agent, and
  inclusion in one Melee round as a case study.

After the pilot: the DAO pays a flat operation fee (target 2–3k USDC/month)
or the deployment is handed over with the playbook — their choice. We are
open to part-SHU compensation with vesting.

## Why us

We shipped before asking: a working deployment against Concorde's actual
source, the first third-party Component, and a public dashboard — all built
in the open. Funding buys production operation and co-designed workflows,
not a promise.

## Success metrics

- Agent live for ≥ 5 delegates with weekly active use through the pilot.
- ≥ 10 sealed commitments published and revealed in real governance use.
- One grant round run with sealed-bid reviews end to end.
- One additional DAO signed as a paying Gov-Hub deployment (pipeline for
  Concorde + Shutter API adoption beyond 0x36).
