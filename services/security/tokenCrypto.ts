import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
}

function getKey(envVarName: string): Buffer {
  const raw = process.env[envVarName];
  if (!raw) {
    throw new Error(
      `${envVarName} não configurada — defina uma chave (openssl rand -base64 32) nas variáveis de ambiente antes de salvar este token.`,
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(`${envVarName} inválida — deve ser uma chave base64 de 32 bytes.`);
  }
  return key;
}

/** Generic AES-256-GCM secret encryption, parameterized by which env var
 * holds the key — introduced in Fase 35 so every OAuth-connected integration
 * (Meta, Google Ads, GA4, GTM, Search Console, and whatever comes next)
 * shares one audited implementation instead of each rewriting the same 30
 * lines. services/metaConversionsApi/tokenCrypto.ts (Fase 9) now delegates
 * here unchanged — same signatures, same behavior, same key. */
export function encryptSecret(plaintext: string, envVarName: string): EncryptedSecret {
  const key = getKey(envVarName);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([encrypted, authTag]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptSecret(ciphertext: string, iv: string, envVarName: string): string {
  const key = getKey(envVarName);
  const ivBuffer = Buffer.from(iv, "base64");
  const combined = Buffer.from(ciphertext, "base64");
  const authTag = combined.subarray(combined.length - 16);
  const encrypted = combined.subarray(0, combined.length - 16);

  const decipher = createDecipheriv(ALGORITHM, key, ivBuffer);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function isSecretEncryptionConfigured(envVarName: string): boolean {
  return Boolean(process.env[envVarName]);
}
