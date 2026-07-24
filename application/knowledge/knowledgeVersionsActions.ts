"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoKnowledgeVersions } from "@/lib/demo/mockKnowledge";
import { listVersions } from "@/repositories/knowledge/versionsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { restoreVersion } from "@/services/knowledge/knowledgeDocumentService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { KnowledgeVersion } from "@/types/knowledge";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function fetchKnowledgeDocumentVersions(
  documentId: string,
): Promise<KnowledgeVersion[]> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoKnowledgeVersions(documentId);

  const supabase = await getSupabaseAuthClient();
  return listVersions(supabase, documentId);
}

export async function restoreKnowledgeVersionAction(
  documentId: string,
  versionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await restoreVersion(supabase, documentId, versionId, profile.id);

  revalidatePath(`/base-conhecimento/documentos/${documentId}`);
  return { ok: true };
}
