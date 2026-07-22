"use server";

import { cookies } from "next/headers";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { DEMO_MODE_COOKIE } from "@/lib/demo/constants";

/** Toggles Demo Mode for the current staff member. The cookie (not just
 * localStorage) is what makes this work without a page reload: Server
 * Components read it via cookies() on the next `router.refresh()`, so the
 * currently-mounted page re-fetches through the same query functions and
 * gets fictitious data back instead of hitting Supabase — no navigation,
 * no logout, no hard reload. */
export async function setDemoModeAction(enabled: boolean): Promise<void> {
  await requireCrmProfile();
  const store = await cookies();

  if (enabled) {
    store.set(DEMO_MODE_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  } else {
    store.delete(DEMO_MODE_COOKIE);
  }
}
