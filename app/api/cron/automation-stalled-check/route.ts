import { NextResponse } from "next/server";
import { runStalledLeadCheck } from "@/services/automation/automationEngine";
import { getSupabaseServerClient } from "@/services/supabase/server";

export const dynamic = "force-dynamic";

/** Vercel Cron target (see vercel.json) — the only trigger type the
 * automation engine can't react to synchronously, since "lead parado há X
 * dias" is noticed by scanning, not by an event. Protected by CRON_SECRET,
 * same pattern as /api/cron/meta-retry. Uses the service-role client since
 * a cron request has no user session/cookies. */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const evaluated = await runStalledLeadCheck(supabase);

  return NextResponse.json({ ok: true, evaluated });
}
