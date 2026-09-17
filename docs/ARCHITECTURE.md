# Architecture

Gov-Hub has two halves: the **operator** (the product — a Concorde
deployment we run per DAO) and the **web** dashboard (the public face).

## Operator (`operator/`)

A [Concorde](https://github.com/shutter-network/concorde) Gateway. Members
never reach the agent directly; the Gateway mediates everything and keeps
the durable record.

```
 delegates ──HTTP──► Public server ─► Messenger ─► Signal queue
                                                       │ (serial)
                     Postgres ◄─── Db ◄────────────────┤
                                                       ▼
                              Signal Handlers (our code, trusted)
                              ├─ message → Q&A Prompt (per-user session)
                              ├─ digest schedule → fetch Snapshot hub,
                              │    hand fresh data to the agent in the Prompt
                              └─ sealed-reveal schedule → Shutter API key
                                   fetch, decrypt, publish reveal Decision
                                                       │
                                                       ▼
                              Agent runs (fresh container per Run, pi agent)
                                 └─► Agent server routes:
                                     messages, decisions, schedules,
                                     POST /sealed-commitments  (ours)
```

### The Sealed Commitments Component

`operator/src/sealed-commitments.ts` — a third-party Concorde Component
combining two primitives:

1. **Concorde Decisions**: Ed25519-signed, numbered, immutable statements.
2. **Shutter timelock encryption**: the Keyper network releases decryption
   keys only after a registered timestamp.

Flow: agent calls `POST /sealed-commitments {statement, revealAt}` → we
register a Shutter identity for `revealAt`, encrypt the statement (the
plaintext never touches the database), publish a Decision carrying the
ciphertext, and arm a one-shot Schedule. At reveal time the Schedule fires,
we fetch the released key, decrypt, and publish a linked reveal Decision.
A third party can verify the whole chain offline: both signatures with the
agent's public key, and the decryption against the published ciphertext.

Trust model: the Operator (us) is trusted to run the Gateway — that is
Concorde's own model — but *cannot* open a sealed commitment early, because
early decryption requires colluding with a threshold of Shutter Keypers.

### Dependency note

Concorde is not on the npm registry yet. `scripts/setup-vendor.sh` clones it
into `vendor/` (dependencies installed with `--ignore-scripts`); the
operator typechecks against that source via `tsconfig` paths, and the
Docker image builds it. Pin a commit before selling uptime.

## Web (`web/`)

Serverless Vite + React SPA: live proposals for the DAO's Snapshot space
(shielded-voting badges, quorum), deep links to Forum/Snapshot/Decent, and
a browser demo of Shutter sealed positions (in-browser threshold BLS via
the SDK's WASM). Multi-tenant via `web/src/config/daos.ts`. Later: the
public verification page for the agent's sealed commitments.
