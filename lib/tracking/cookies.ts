const DEFAULT_MAX_AGE_DAYS = 365;

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Writes a cookie. Pass `maxAgeDays: null` for a session cookie (cleared
 * when the browser closes) instead of a persistent one. */
export function writeCookie(
  name: string,
  value: string,
  maxAgeDays: number | null = DEFAULT_MAX_AGE_DAYS,
) {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays === null ? "" : `; max-age=${maxAgeDays * 24 * 60 * 60}`;
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API isn't supported in Safari/Firefox yet
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/${maxAge}; SameSite=Lax`;
}
