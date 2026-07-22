import "server-only";

import { createHash } from "node:crypto";

/** SHA-256 hex digest — the exact format Meta's Conversions API requires for
 * every hashed `user_data` field (em, ph, fn, ln, ...). Never called on the
 * client: this file is only ever imported from server-only modules
 * (domain code has no "use client"/"use server" of its own, but nothing
 * outside services/metaConversionsApi and its callers imports it). */
function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Meta's normalization rules before hashing: lowercase, trimmed, no extra
 * whitespace. Applies to email and name fields. */
function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function hashEmail(email: string): string {
  return sha256Hex(normalize(email));
}

/** Phone: digits only (Meta expects E.164-style digits, no symbols). This
 * does not attempt to add a country code when the stored number lacks
 * one — a known limitation, documented in the Fase 9 report, since Brusync
 * doesn't currently record which country a phone number belongs to. */
export function hashPhone(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  return sha256Hex(digitsOnly);
}

export function hashName(name: string): string {
  return sha256Hex(normalize(name));
}

export function hashCity(city: string): string {
  return sha256Hex(normalize(city).replace(/\s+/g, ""));
}
