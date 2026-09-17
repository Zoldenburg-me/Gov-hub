/**
 * Client for the Shutter API (https://shutter-api.shutter.network) plus local
 * encryption/decryption via @shutter-network/shutter-sdk.
 *
 * Flow (per https://docs.shutter.network/docs/protocol/api/get_started):
 *  1. register_identity with a future decryptionTimestamp — the Keyper network
 *     commits to releasing the decryption key at that time.
 *  2. Encrypt locally with the eon key (threshold BLS, runs in-browser via WASM).
 *  3. After the timestamp, fetch the decryption key and decrypt locally.
 *
 * Nobody — not Gov-Hub, not any single Keyper — can decrypt before the
 * reveal time. That is the whole point.
 */

import { encryptData, decrypt } from "@shutter-network/shutter-sdk";

export const SHUTTER_API_BASE = "https://shutter-api.shutter.network/api";

export interface SealedCommitment {
  version: 1;
  identity: `0x${string}`;
  eonKey: `0x${string}`;
  ciphertext: `0x${string}`;
  decryptionTimestamp: number; // unix seconds
  createdAt: number; // unix seconds
  label?: string;
}

interface RegisterIdentityResponse {
  eon: number;
  identity: `0x${string}`;
  identity_prefix: `0x${string}`;
  eon_key: `0x${string}`;
  tx_hash?: string;
}

function randomHex32(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function utf8ToHex(text: string): `0x${string}` {
  const bytes = new TextEncoder().encode(text);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function hexToUtf8(hex: string): string {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

/** Unwrap the { message: ... } envelope some Shutter API deployments use. */
function unwrap<T>(json: unknown): T {
  if (json && typeof json === "object" && "message" in (json as Record<string, unknown>)) {
    return (json as { message: T }).message;
  }
  return json as T;
}

export async function registerIdentity(
  decryptionTimestamp: number,
): Promise<RegisterIdentityResponse> {
  const res = await fetch(`${SHUTTER_API_BASE}/register_identity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decryptionTimestamp,
      identityPrefix: randomHex32(),
    }),
  });
  if (!res.ok) {
    throw new Error(`Shutter API register_identity failed: HTTP ${res.status}`);
  }
  return unwrap<RegisterIdentityResponse>(await res.json());
}

/**
 * Seal a plaintext note so it can only be revealed at `decryptionTimestamp`.
 * Returns a self-contained commitment object that can be posted anywhere
 * public (forum thread, IPFS, a PR description) as a tamper-evident pledge.
 */
export async function seal(
  plaintext: string,
  decryptionTimestamp: number,
  label?: string,
): Promise<SealedCommitment> {
  const reg = await registerIdentity(decryptionTimestamp);
  const sigma = randomHex32();
  const ciphertext = await encryptData(
    utf8ToHex(plaintext),
    reg.identity,
    reg.eon_key,
    sigma,
  );
  return {
    version: 1,
    identity: reg.identity,
    eonKey: reg.eon_key,
    ciphertext,
    decryptionTimestamp,
    createdAt: Math.floor(Date.now() / 1000),
    label,
  };
}

/**
 * Reveal a sealed commitment. Fails while the Keyper network has not yet
 * released the decryption key (i.e. before decryptionTimestamp).
 */
export async function reveal(commitment: SealedCommitment): Promise<string> {
  const res = await fetch(
    `${SHUTTER_API_BASE}/get_decryption_key?identity=${commitment.identity}`,
  );
  if (!res.ok) {
    if (res.status === 400 || res.status === 404) {
      throw new Error(
        "Decryption key not released yet — the reveal time has not passed.",
      );
    }
    throw new Error(`Shutter API get_decryption_key failed: HTTP ${res.status}`);
  }
  const data = unwrap<{ decryption_key: `0x${string}` }>(await res.json());
  const key =
    data.decryption_key ??
    (data as unknown as { key: `0x${string}` }).key ??
    (data as unknown as `0x${string}`);
  const plaintextHex = await decrypt(commitment.ciphertext, key);
  return hexToUtf8(plaintextHex);
}
