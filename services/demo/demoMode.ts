import "server-only";

import { cookies } from "next/headers";
import { DEMO_MODE_COOKIE } from "@/lib/demo/constants";

/** Single source of truth for "is Demo Mode on?", read from the cookie the
 * toggle button sets (services/demo/demoMode + application/demo). Every
 * data-fetching entry point (application/crm/*Queries.ts,
 * application/marketingAnalytics/*) checks this before deciding whether to
 * return the fictitious dataset (lib/demo/*) or query Supabase — that check
 * is the "single provider" boundary: no component ever branches on demo
 * mode itself, it just calls the same functions it always did. */
export async function isDemoModeActive(): Promise<boolean> {
  const store = await cookies();
  return store.get(DEMO_MODE_COOKIE)?.value === "1";
}
