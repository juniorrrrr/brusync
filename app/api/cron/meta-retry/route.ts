import { NextResponse } from "next/server";
import { listDeliveriesForRetry } from "@/repositories/conversions/conversionDeliveriesRepository";
import { dispatchMetaDelivery } from "@/services/conversionsHub/dispatchMetaDelivery";
import { getSupabaseServerClient } from "@/services/supabase/server";

export const dynamic = "force-dynamic";

/** Backoff schedule indexed by `attempts` (1 = failed once, ...) — a
 * delivery only becomes eligible for retry again once this many minutes
 * have passed since its last attempt. Caps out at 5 attempts total
 * (services/conversionsHub/dispatchMetaDelivery.ts's MAX_ATTEMPTS); after
 * that it stays "falhou" until someone hits "Reenviar" manually from the
 * Lead Workspace's Meta tab. */
const BACKOFF_MINUTES_BY_ATTEMPTS: Record<number, number> = {
  1: 1,
  2: 5,
  3: 30,
  4: 120,
};

/** Vercel Cron target (see vercel.json) — retries stuck/failed Meta
 * deliveries. Protected by CRON_SECRET so it can't be triggered by anyone
 * who isn't Vercel's scheduler (or someone who knows the secret). Uses the
 * service-role client because a cron request has no user session/cookies —
 * it never bypasses Demo Mode's protections, since dispatchMetaDelivery()
 * itself refuses to send anything while Demo Mode is active regardless of
 * which client called it. */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  let totalRetried = 0;

  for (const [attemptsStr, backoffMinutes] of Object.entries(BACKOFF_MINUTES_BY_ATTEMPTS)) {
    const attempts = Number(attemptsStr);
    const staleBefore = new Date(Date.now() - backoffMinutes * 60_000).toISOString();
    const deliveries = await listDeliveriesForRetry(supabase, "meta_ads", attempts, staleBefore);

    for (const delivery of deliveries) {
      await dispatchMetaDelivery(supabase, delivery.id);
      totalRetried += 1;
    }
  }

  return NextResponse.json({ ok: true, retried: totalRetried });
}
