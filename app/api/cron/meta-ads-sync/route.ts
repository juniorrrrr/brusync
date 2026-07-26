import { NextResponse } from "next/server";
import {
  enqueueDailyIncrementalJobs,
  processDueSyncJobs,
} from "@/services/metaAds/metaAdsSyncService";
import { getSupabaseServerClient } from "@/services/supabase/server";

export const dynamic = "force-dynamic";

/** Vercel Cron target (vercel.json) — mesmo padrão de
 * app/api/cron/meta-retry/route.ts: protegido por CRON_SECRET, usa o
 * client de service-role (sem sessão de usuário). Primeiro garante que
 * toda conta conectada tenha um job "insights" pendente para o dia, depois
 * processa a fila (retry/backoff já embutidos em
 * services/metaAds/metaAdsSyncService.ts::processSyncJob). */
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
