import { NextResponse } from "next/server";
import {
  enqueueDailyIncrementalJobs,
  processDueSyncJobs,
} from "@/services/searchConsole/searchConsoleSyncService";
import { getSupabaseServerClient } from "@/services/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const enqueued = await enqueueDailyIncrementalJobs(supabase);
  const processed = await processDueSyncJobs(supabase);

  return NextResponse.json({ ok: true, enqueued, processed });
}
