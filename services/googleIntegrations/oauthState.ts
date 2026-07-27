import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

/** Generic OAuth CSRF state cookie, parameterized by cookie name so each of
 * the four Google integrations (and Meta's own, if it ever wants to switch)
 * gets an independent short-lived cookie instead of colliding on one shared
 * name — same pattern as services/metaAds/metaAdsOAuthService.ts's
 * createOAuthState/consumeOAuthState, generalized. */
export async function createGoogleOAuthState(cookieName: string): Promise<string> {
  const state = randomBytes(24).toString("hex");
  const store = await cookies();
  store.set(cookieName, state, {
    path: "/",
    maxAge: 60 * 10,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return state;
}

export async function consumeGoogleOAuthState(
  cookieName: string,
  receivedState: string,
): Promise<boolean> {
  const store = await cookies();
  const expected = store.get(cookieName)?.value;
  store.delete(cookieName);
  return Boolean(expected) && expected === receivedState;
}
