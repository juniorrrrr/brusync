"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { getIntegrationLogsPageData } from "@/application/integrations/integrationLogsQueries";
import { getIntegrationsPageData } from "@/application/integrations/integrationsQueries";
import {
  getIntegrationByProvider,
  updateIntegration,
} from "@/repositories/integrations/integrationsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { Integration, IntegrationLog } from "@/types/integrations";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface IntegrationDetail {
  integration: Integration;
  recentLogs: IntegrationLog[];
}

export async function fetchIntegrationDetail(provider: string): Promise<IntegrationDetail | null> {
  await requireCrmProfile();

  const { integrations } = await getIntegrationsPageData();
  const integration = integrations.find((i) => i.provider === provider);
  if (!integration) return null;

  const { logs } = await getIntegrationLogsPageData({ provider, limit: 20 });
  return { integration, recentLogs: logs };
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

  revalidatePath("/integracoes");

  return { status: "success", message: "Preferências salvas." };
}
