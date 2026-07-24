"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoChannels, getDemoMessageTemplates } from "@/lib/demo/mockCommunication";
import { listChannels } from "@/repositories/communication/channelsRepository";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
} from "@/repositories/communication/templatesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { ChannelType } from "@/types/communication";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function fetchChannels() {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoChannels();

  const supabase = await getSupabaseAuthClient();
  return listChannels(supabase);
}

export async function fetchMessageTemplates() {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoMessageTemplates();

  const supabase = await getSupabaseAuthClient();
  return listTemplates(supabase);
}

export async function createTemplateAction(
  _prevState: { status: "idle" | "success" | "error"; message?: string },
  formData: FormData,
): Promise<{ status: "idle" | "success" | "error"; message?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const channelType = (String(formData.get("channelType") ?? "").trim() ||
    null) as ChannelType | null;

  if (!name || !body) return { status: "error", message: "Informe nome e texto do modelo." };

  const supabase = await getSupabaseAuthClient();
  await createTemplate(supabase, { name, body, channelType, createdBy: profile.id });

  return { status: "success", message: "Modelo criado." };
}

export async function deleteTemplateAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await deleteTemplate(supabase, id);
  return { ok: true };
}
