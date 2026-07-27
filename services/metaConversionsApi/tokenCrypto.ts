import "server-only";

import {
  decryptSecret,
  type EncryptedSecret,
  encryptSecret,
  isSecretEncryptionConfigured,
} from "@/services/security/tokenCrypto";

const KEY_ENV_VAR = "META_TOKEN_ENCRYPTION_KEY";

export type EncryptedToken = EncryptedSecret;

/** Encrypts the Meta Access Token with AES-256-GCM before it's ever written
 * to the database — services/conversionsHub/dispatchMetaDelivery.ts is the
 * only place that decrypts it, right before calling the Meta Conversions
 * API, and never returns the plaintext to any client component. Delegates
 * to services/security/tokenCrypto.ts (Fase 35) — same algorithm, same key,
 * same behavior as before that generic module existed. */
export function encryptToken(plaintext: string): EncryptedToken {
  return encryptSecret(plaintext, KEY_ENV_VAR);
}

export function decryptToken(ciphertext: string, iv: string): string {
  return decryptSecret(ciphertext, iv, KEY_ENV_VAR);
}

export function isTokenEncryptionConfigured(): boolean {
  return isSecretEncryptionConfigured(KEY_ENV_VAR);
}
