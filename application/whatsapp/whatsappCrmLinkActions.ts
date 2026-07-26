"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { getProjectsPageData } from "@/application/projects/projectsQueries";
import { isDemoModeActive } from "@/services/demo/demoMode";
import {
  linkConversationToClient,
  linkConversationToLead,
  linkConversationToProject,
} from "@/services/whatsapp/whatsappCrmLinkService";
import type { Project } from "@/types/projects";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function searchProjectsForWhatsappAction(query: string): Promise<Project[]> {
  await requireCrmProfile();
  if (!query.trim()) return [];
  const { projects } = await getProjectsPageData({ search: query, limit: 8 });
  return projects;
}

export async function linkWhatsappConversationToLeadAction(
  conversationId: string,
  contactId: string,
  crmLeadId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  await linkConversationToLead(conversationId, contactId, crmLeadId);
  revalidatePath("/whatsapp");
  return { ok: true };
}

export async function linkWhatsappConversationToClientAction(
  conversationId: string,
  contactId: string,
  clientId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  await linkConversationToClient(conversationId, contactId, clientId);
  revalidatePath("/whatsapp");
  return { ok: true };
}

export async function linkWhatsappConversationToProjectAction(
  conversationId: string,
  projectId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  await linkConversationToProject(conversationId, projectId);
  revalidatePath("/whatsapp");
  return { ok: true };
}
