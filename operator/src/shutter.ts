/**
 * Node-side client for the Shutter API (timelock threshold encryption by the
 * Keyper network) plus local encryption/decryption via the Shutter SDK.
 *
 * Same protocol as web/src/lib/shutter.ts, but written for the Gateway: the
 * Operator's code seals and reveals; the plaintext of a pending commitment
 * never exists anywhere but in the sealing request.
 */

import { decrypt, encryptData } from "@shutter-network/shutter-sdk";

export type Hex = `0x${string}`;

export type Sealed = {
  identity: Hex;
  eonKey: Hex;
  ciphertext: Hex;
  decryptionTimestamp: number;
};

function randomHex32(): Hex {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function utf8ToHex(text: string): Hex {
  const bytes = new TextEncoder().encode(text);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function hexToUtf8(hex: string): string {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

/** Unwrap the { message: ... } envelope some Shutter API deployments use. */
function unwrap<T>(json: unknown): T {
  if (json !== null && typeof json === "object" && "message" in json) {
    return (json as { message: T }).message;
  }
  return json as T;
}

export type ShutterClient = {
  seal(plaintext: string, decryptionTimestamp: number): Promise<Sealed>;
  reveal(sealed: Pick<Sealed, "identity" | "ciphertext">): Promise<string>;
};

export function createShutterClient(apiBase: string): ShutterClient {
  async function registerIdentity(
    decryptionTimestamp: number,
  ): Promise<{ identity: Hex; eon_key: Hex }> {
    const res = await fetch(`${apiBase}/register_identity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decryptionTimestamp, identityPrefix: randomHex32() }),
    });
    if (!res.ok) {
      throw new Error(`Shutter API register_identity failed: HTTP ${res.status}`);
    }
    return unwrap(await res.json());
  }

  return {
    async seal(plaintext, decryptionTimestamp) {
      const reg = await registerIdentity(decryptionTimestamp);
      const ciphertext = await encryptData(
        utf8ToHex(plaintext),
        reg.identity,
        reg.eon_key,
        randomHex32(),
      );
      return { identity: reg.identity, eonKey: reg.eon_key, ciphertext, decryptionTimestamp };
    },

    async reveal(sealed) {
      const res = await fetch(`${apiBase}/get_decryption_key?identity=${sealed.identity}`);
      if (!res.ok) {
        throw new Error(
          res.status === 400 || res.status === 404
            ? "decryption key not released yet"
            : `Shutter API get_decryption_key failed: HTTP ${res.status}`,
        );
      }
      const data = unwrap<{ decryption_key?: Hex; key?: Hex }>(await res.json());
      const key = data.decryption_key ?? data.key;
      if (key === undefined) {
        throw new Error("Shutter API answered without a decryption key");
      }
      return hexToUtf8(await decrypt(sealed.ciphertext, key));
    },
  };
}
