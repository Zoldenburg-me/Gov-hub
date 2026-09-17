# Gov-Hub

**Gov-Hub runs shared AI agents for DAOs — built on
[Shutter Network](https://www.shutter.network)'s
[Concorde](https://github.com/shutter-network/concorde) framework and
threshold encryption.**

Concorde defines an *Operator*: the party every member of a group trusts to
run their shared agent. Shutter wrote the framework and the trust model, but
nobody occupies the role commercially. Gov-Hub is that Operator, sold as a
service per DAO. Flagship deployment:
**[Shutter DAO 0x36](https://www.shutter.network/shutter-dao)**.

## What a DAO buys

A shared agent its members reach only through a neutral Gateway we operate:

- **Member Q&A over one durable record** — no private access for anyone,
  every exchange logged, the agent neutral between members by construction.
- **Daily governance digest** — live Snapshot state fetched Gateway-side and
  digested to every delegate; shielded-vote tallies never speculated about.
- **Signed commitments** — the agent publishes Ed25519-signed, numbered,
  immutable Decisions anyone can verify offline.
- **A public voice** — mention the DAO's account on Farcaster or X and the
  agent answers in the thread (the Grok pattern), Gateway-mediated and
  audit-logged; asked about an open vote, it publishes a **sealed
  forecast** that auto-reveals at vote close instead of an opinion, so it
  provably cannot steer the vote it comments on.
- **Sealed commitments** — our own Concorde Component
  ([`operator/src/sealed-commitments.ts`](operator/src/sealed-commitments.ts)):
  Decisions whose content is timelock-encrypted by the Shutter Keyper
  network. Published and signed now, readable by nobody (us included) until
  the reveal time, then decrypted and republished automatically as a linked
  reveal Decision. Tamper-evident forward commitments for an autonomous
  agent — embargoed positions, sealed grant scores, pre-committed actions.

## Repository layout

| Path | What it is |
| --- | --- |
| [`operator/`](operator/) | The Concorde deployment for Shutter DAO 0x36: Gateway wiring, Signal Handlers, the Sealed Commitments Component, compose stack. Typechecked against vendored Concorde source. |
| [`web/`](web/) | Public governance dashboard (Vite + React): live `shutterdao0x36.eth` proposals with shielded-voting state, plus a browser demo of Shutter sealed positions. The build is validated. |
| [`docs/`](docs/) | [Architecture](docs/ARCHITECTURE.md) and the [funding proposal draft to Shutter DAO 0x36](docs/PITCH-shutter-dao-0x36.md). |
| `scripts/setup-vendor.sh` | Fetches Concorde (not yet on npm) into `vendor/` for typechecking and image builds. |

## Quick start

```bash
# dashboard
cd web && npm install && npm run build

# operator (see operator/README.md for the full deployment)
./scripts/setup-vendor.sh
cd operator && npm install && npm run typecheck
```

## Why Shutter's stack

Shutter's Keyper network provides threshold encryption nobody — no single
party, us included — can open early. That is the property that makes a
shared agent's *sealed* commitments credible, and it is infrastructure the
DAO behind it ([Shutter DAO 0x36](https://docs.shutter.network/docs/dao/0x36))
actively funds adoption of. Gov-Hub is both a product for DAOs and a
standing demonstration of Shutter's API and Concorde framework in
production.
