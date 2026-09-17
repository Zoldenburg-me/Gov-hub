# Architecture

Gov-Hub v0.1 is deliberately serverless: a static Vite + React SPA. Every
integration is a public, unauthenticated API called from the browser, so the
whole product can be hosted from a CDN and audited by anyone.

```
┌────────────────────────── Browser ──────────────────────────┐
│  React SPA                                                  │
│  ├─ src/config/daos.ts        tenant registry (per-DAO)     │
│  ├─ src/lib/snapshot.ts  ───► hub.snapshot.org/graphql      │
│  │       proposals, space stats, shielded-voting flag       │
│  ├─ src/lib/shutter.ts   ───► shutter-api.shutter.network   │
│  │       register_identity / get_decryption_key             │
│  │       + @shutter-network/shutter-sdk (BLS via WASM):     │
│  │         encryptData / decrypt run locally                │
│  └─ src/lib/storage.ts        localStorage (convenience     │
│                               only; commitments are         │
│                               self-contained JSON)          │
└─────────────────────────────────────────────────────────────┘
```

## Sealed Positions data flow

1. **Seal** — `POST /register_identity` with a random 32-byte
   `identityPrefix` and the chosen `decryptionTimestamp`. The response's
   `identity` + `eon_key` feed `encryptData()` (plaintext → ciphertext,
   entirely client-side, random sigma).
2. **Publish** — the commitment is a self-contained JSON blob
   (`identity`, `eonKey`, `ciphertext`, `decryptionTimestamp`). Users post it
   wherever their community lives. Gov-Hub keeps a localStorage copy purely
   as a convenience.
3. **Reveal** — after the timestamp, `GET /get_decryption_key?identity=…`
   returns the key the Keyper network released; `decrypt()` recovers the
   plaintext locally. Anyone holding the JSON can do this — reveal is
   permissionless and verifiable.

Trust model: early decryption requires colluding with a threshold of Shutter
Keypers. Gov-Hub holds no secrets and can disappear without breaking anyone's
commitments.

## Adding a tenant

Add a `DaoConfig` to `src/config/daos.ts` (Snapshot space id, links, treasury
addresses). Everything else — dashboard, badges, sealed positions — is
tenant-agnostic. The hosted/paid version moves this registry server-side with
per-DAO theming and custom domains.

## Known deferred work

- The Shutter API response envelope (`{ message: … }` wrapper, key field
  names) is normalized defensively in `src/lib/shutter.ts::unwrap` — confirm
  against the live API on first deploy (the build sandbox had no egress).
- Registering an identity costs the API service gas on Gnosis Chain; heavy
  usage should move behind a Gov-Hub-operated registration proxy with an API
  key, which is also the metering point for the paid tier.
