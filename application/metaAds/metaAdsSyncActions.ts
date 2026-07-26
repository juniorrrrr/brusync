"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import type { MetaAdsActionState } from "@/application/metaAds/metaAdsAccountActions";
import { getMetaAccountById } from "@/repositories/metaAds/accountsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { enqueueManualSync, processSyncJob } from "@/services/metaAds/metaAdsSyncService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

/** Enfileira E processa a sincronização na mesma chamada — dá feedback
 * imediato ao clicar em "Sincronizar agora" em vez de deixar o usuário
 * esperando o próximo ciclo do cron (app/api/cron/meta-ads-sync). O cron
 * continua sendo o único responsável pela sincronização incremental
 * automática diária. */
export async function triggerManualSyncAction(accountId: string): Promise<MetaAdsActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  try {
    const job = await enqueueManualSync(supabase, accountId, profile.id);
    await processSyncJob(supabase, job);
    revalidatePath("/meta-ads");
    revalidatePath("/meta-ads/configuracoes");

    // processSyncJob nunca lança (erro vira `falhou` + backoff na própria
    // fila) — o resultado real é lido de volta pelo status da conta.
    const account = await getMetaAccountById(supabase, accountId);
    if (account?.status === "erro") {
      return { status: "error", message: account.error ?? "Falha ao sincronizar." };
    }
    return { status: "success", message: "Sincronização concluída." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Falha ao sincronizar.",
    };
  }
}
