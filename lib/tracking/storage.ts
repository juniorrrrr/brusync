import { readCookie, writeCookie } from "./cookies";

/** Reads a string value, preferring localStorage and falling back to a
 * cookie of the same name (covers Safari private mode / storage blocked by
 * privacy settings, where localStorage throws or silently no-ops). */
export function getItem(key: string): string | null {
  try {
    const fromLocalStorage = window.localStorage.getItem(key);
    if (fromLocalStorage !== null) return fromLocalStorage;
  } catch {
    // localStorage unavailable — fall through to cookie
  }
  return readCookie(key);
}

/** Writes to localStorage and mirrors to a cookie, so a later read still
 * succeeds even if localStorage becomes unavailable mid-session. */
export function setItem(key: string, value: string, cookieMaxAgeDays: number | null = 365) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable — the cookie mirror below still persists it
  }
  writeCookie(key, value, cookieMaxAgeDays);
}

/** sessionStorage-only accessor (no persistent fallback by design — used
 * for session-scoped values where a cookie mirror is provided by the caller
 * instead, since sessionStorage and session cookies share the same
 * "cleared when the browser closes" lifetime). */
export function getSessionItem(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setSessionItem(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // ignore — caller falls back to a session cookie
  }
}

export function getJsonItem<T>(key: string): T | null {
  const raw = getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setJsonItem(key: string, value: unknown, cookieMaxAgeDays: number | null = 365) {
  setItem(key, JSON.stringify(value), cookieMaxAgeDays);
}
