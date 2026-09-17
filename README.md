# Gov-Hub

**One pane of glass for DAO governance, with commitments sealed by [Shutter Network](https://www.shutter.network) threshold encryption.**

Flagship tenant: **[Shutter DAO 0x36](https://www.shutter.network/shutter-dao)**.

## Why

Shutter DAO 0x36's governance lives in three places: the
[Discourse forum](https://shutternetwork.discourse.group) (discussion), the
[Snapshot space `shutterdao0x36.eth`](https://snapshot.org/#/shutterdao0x36.eth)
(off-chain shielded voting), and [Decent](https://app.decentdao.org) (on-chain
executable votes). Delegates context-switch constantly; newcomers get lost.

Gov-Hub unifies them — and adds a governance primitive that only Shutter's own
technology makes possible.

## Features (v0.1)

- **Proposal dashboard** — live proposals from the Snapshot hub with state,
  quorum progress, vote counts, and a *shielded* badge when a proposal uses
  Shutter shielded voting (tallies are hidden while voting is open, exactly as
  the encryption guarantees).
- **Sealed Positions** — timelock-encrypted commitments built directly on the
  [Shutter API](https://www.shutter.network/shutter-api) and
  [`@shutter-network/shutter-sdk`](https://www.npmjs.com/package/@shutter-network/shutter-sdk):
  1. Write a position (a delegate stance, an embargoed proposal draft, a
     sealed grant-review score) and pick a reveal time.
  2. Gov-Hub registers an identity with the Keyper network and encrypts
     **in your browser** (threshold BLS via WASM — the plaintext never leaves
     your machine).
  3. Post the sealed JSON anywhere public (e.g. the forum) as a
     tamper-evident pledge. Nobody — not you, not Gov-Hub, not any single
     Keyper — can open it early. After the reveal time, anyone can decrypt it.
- **Governance surface links** — forum, Snapshot, Decent, and treasury
  contracts one click away.

Multi-tenant by design: onboarding another DAO is one entry in
[`src/config/daos.ts`](src/config/daos.ts).

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # typecheck + production build (validated)
```

No backend, no keys, no tracking: the browser talks straight to the Snapshot
GraphQL hub and the public Shutter API.

> **Note:** `npm run build` (typecheck + bundle, incl. the SDK's WASM) is
> verified in CI-like conditions. The live calls to `hub.snapshot.org` and
> `shutter-api.shutter.network` run client-side and were not reachable from
> the build sandbox; the response envelope is normalized defensively in
> [`src/lib/shutter.ts`](src/lib/shutter.ts) — verify against the live API on
> first deploy.

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the pieces fit.
- [`docs/PITCH-shutter-dao-0x36.md`](docs/PITCH-shutter-dao-0x36.md) — draft
  funding proposal to Shutter DAO 0x36 (Shutter Champions / forum proposal).

## Roadmap

- Forum feed integration (Discourse API) and cross-linking proposals ↔ threads.
- On-chain (Decent/Safe) proposal + treasury balances via RPC.
- Hosted sealed-commitment registry so commitments are browsable per proposal.
- Sealed-bid grant rounds: reviewers commit scores before discussion opens.
- Per-DAO hosted config + custom domains (the paid tier).
