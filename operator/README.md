# Gov-Hub Operator — Shutter DAO 0x36 deployment

This is a [Concorde](https://github.com/shutter-network/concorde) deployment:
Gov-Hub acting as the **Operator** (Concorde's own term — the party every
member trusts to run and configure a shared agent) of a shared agent for
Shutter DAO 0x36's delegates.

## What this deployment gives the DAO

- **One shared agent, no private access.** Delegates talk to the agent
  through the Gateway; every exchange lands in a durable per-user Message
  log. Nobody — including us — can whisper to it.
- **A daily governance digest.** A Schedule fires, the handler fetches live
  Snapshot state for `shutterdao0x36.eth` (Gateway-side, so the agent needs
  no network), and the agent messages every delegate what opened, what
  closes soon, what resolved.
- **Signed commitments.** The agent publishes Decisions — Ed25519-signed,
  numbered, immutable statements any delegate can verify offline.
- **Sealed commitments (ours).** `src/sealed-commitments.ts` is a
  third-party Concorde Component that crosses the Decision log with the
  [Shutter API](https://www.shutter.network/shutter-api): the agent commits
  to a statement whose content is timelock-encrypted by the Keyper network.
  The ciphertext is published and signed immediately; nobody (Operator
  included) can read it until the reveal time, when a one-shot Schedule
  decrypts it and publishes the plaintext as a linked reveal Decision.
  Tamper-evident forward commitments for an autonomous agent — only
  Shutter's threshold encryption makes this possible.

## Layout

- `main.ts` — the entry point: Gateway wiring, Signal Handlers, seeding.
- `src/sealed-commitments.ts` — the Sealed Commitments Component.
- `src/shutter.ts` — Shutter API client (register identity / seal / reveal).
- `src/snapshot.ts` — Snapshot hub client for the digest.
- `AGENTS.md`, `settings.json` — the agent's instructions and model config.
- `compose.yml`, `Dockerfile`, `Dockerfile.agent` — the deployment.

## Running it

Concorde is not on the npm registry yet, so it is vendored:

```bash
# from the repository root
./scripts/setup-vendor.sh        # clone + install Concorde (no scripts run)
cd operator
npm install
npm run typecheck                # validates against the vendored source

# deploy (Docker + Docker Compose required)
cp .env.example .env             # fill in ANTHROPIC_API_KEY, DELEGATES
openssl genpkey -algorithm ed25519 -out signing-key.pem
mkdir -p state/workspace state/agent
docker compose up
```

The Gateway's public API listens on `127.0.0.1:8082` (login, messages,
decisions, the agent's public key). Point Concorde's `http-client-tui` at it
or build a client.

> Status: typechecked against Concorde `0.1.0` source; the compose stack is
> untested in this repository's CI sandbox (no Docker daemon) — treat the
> first `docker compose up` as a smoke test. Concorde itself is alpha and
> its API may move under us; the vendor script pins whatever `main` is at
> clone time, so pin a commit before selling uptime.
