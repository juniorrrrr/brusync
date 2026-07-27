"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { getIntegrationLogsPageData } from "@/application/integrations/integrationLogsQueries";
import { getIntegrationsPageData } from "@/application/integrations/integrationsQueries";
import type {
  IntegrationSelectableEntity,
  IntegrationStatusSnapshot,
} from "@/domain/integrations/provider";
import { createIntegrationLog } from "@/repositories/integrations/integrationLogsRepository";
import {
  getIntegrationByProvider,
  updateIntegration,
} from "@/repositories/integrations/integrationsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getIntegrationProvider } from "@/services/integrationsCenter/integrationProviderRegistry";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { Integration, IntegrationLog } from "@/types/integrations";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface IntegrationDetail {
  integration: Integration;
  recentLogs: IntegrationLog[];
  /** Live figures beyond what's persisted on the row (fila, tempo médio,
   * expiração do token) — null for the `meta_ads` Pixel integration, which
   * predates the Fase 34 provider layer and isn't registered in it. */
  liveStatus: IntegrationStatusSnapshot | null;
  isImplemented: boolean;
  /** True quando o OAuth já foi concluído mas nenhuma conta/propriedade/
   * container/site foi escolhida ainda — o Drawer troca o formulário
   * genérico pelo GoogleEntityPicker (Fase 35) enquanto isso for true. */
  needsEntitySelection: boolean;
  selectableEntities: IntegrationSelectableEntity[];
  /** Para onde o botão "Conectar" deve apontar — rota OAuth /start própria
   * (Google Ads/GA4/GTM/Search Console) ou null quando o fluxo mora inteiro
   * na tela de getManageUrl() (Meta Ads) ou o provider não é real. */
  connectUrl: string | null;
}

export async function fetchIntegrationDetail(provider: string): Promise<IntegrationDetail | null> {
  await requireCrmProfile();

  const { integrations } = await getIntegrationsPageData();
  const integration = integrations.find((i) => i.provider === provider);
  if (!integration) return null;

  const { logs } = await getIntegrationLogsPageData({ provider, limit: 20 });

  const dispatched = provider === "meta_ads" ? null : getIntegrationProvider(provider);
  const isImplemented = dispatched?.isImplemented() ?? false;
  const liveStatus = isImplemented && dispatched ? await dispatched.getStatus() : null;
  const needsEntitySelection =
    isImplemented && dispatched ? await dispatched.needsEntitySelection() : false;
  const selectableEntities =
    needsEntitySelection && dispatched?.listSelectableEntities
      ? await dispatched.listSelectableEntities()
      : [];

  return {
    integration,
    recentLogs: logs,
    liveStatus,
    isImplemented,
    needsEntitySelection,
    selectableEntities,
    connectUrl: dispatched?.getConnectUrl() ?? null,
  };
}

export interface ConfigureIntegrationState {
  status: "idle" | "success" | "error";
  message?: string;
}

/** Nesta fase não existe nenhum fluxo real de autenticação (OAuth, API key
 * válida) — esta action só grava preferências não-sensíveis (notas, ligar/
 * desligar) para provar a infraestrutura de configuração. Nunca move uma
 * integração para o status "conectado": isso só deve acontecer quando uma
 * integração real for implementada e validar credenciais de verdade. */
export async function configureIntegrationAction(
  _prevState: ConfigureIntegrationState,
  formData: FormData,
): Promise<ConfigureIntegrationState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) {
    return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };
  }

  const provider = String(formData.get("provider") ?? "");
  const enabled = formData.get("enabled") === "on";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!provider) return { status: "error", message: "Integração inválida." };

  const supabase = await getSupabaseAuthClient();
  const existing = await getIntegrationByProvider(supabase, provider);
  if (!existing) return { status: "error", message: "Integração não encontrada." };

  await updateIntegration(supabase, provider, {
    enabled,
    config: { ...existing.config, notes: notes || undefined },
  });

  await createIntegrationLog(supabase, {
    integrationId: existing.id,
    event: "conexao_editada",
    status: "success",
    message: "Preferências da integração atualizadas.",
    origin: "crm",
    destination: provider,
  });

  revalidatePath("/integracoes");

  return { status: "success", message: "Preferências salvas." };
}
