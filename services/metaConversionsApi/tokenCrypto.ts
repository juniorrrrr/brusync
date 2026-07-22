import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.META_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "META_TOKEN_ENCRYPTION_KEY não configurada — defina uma chave (openssl rand -base64 32) nas variáveis de ambiente antes de salvar o Access Token do Meta.",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("META_TOKEN_ENCRYPTION_KEY inválida — deve ser uma chave base64 de 32 bytes.");
  }
  return key;
}

export interface EncryptedToken {
  ciphertext: string;
  iv: string;
}

/** Encrypts the Meta Access Token with AES-256-GCM before it's ever written
 * to the database — services/conversionsHub/dispatchMetaDelivery.ts is the
 * only place that decrypts it, right before calling the Meta Conversions
 * API, and never returns the plaintext to any client component. The GCM
 * auth tag is appended to the ciphertext so a single column round-trips
 * cleanly. */
export function encryptToken(plaintext: string): EncryptedToken {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([encrypted, authTag]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptToken(ciphertext: string, iv: string): string {
  const key = getKey();
  const ivBuffer = Buffer.from(iv, "base64");
  const combined = Buffer.from(ciphertext, "base64");
  const authTag = combined.subarray(combined.length - 16);
  const encrypted = combined.subarray(0, combined.length - 16);

  const decipher = createDecipheriv(ALGORITHM, key, ivBuffer);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function isTokenEncryptionConfigured(): boolean {
  return Boolean(process.env.META_TOKEN_ENCRYPTION_KEY);
}
