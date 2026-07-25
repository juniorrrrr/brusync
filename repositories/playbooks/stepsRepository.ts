import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlaybookStep } from "@/types/playbooks";

interface StepRow {
  id: string;
  playbook_id: string;
  title: string;
  description: string | null;
  objective: string | null;
  checklist: string[];
  estimated_minutes: number | null;
  notes: string | null;
  links: { label: string; url: string }[];
  files: { name: string; url: string }[];
  scripts: string[];
  best_practices: string[];
  common_mistakes: string[];
  approval_criteria: string[];
  rejection_criteria: string[];
  suggested_actions: PlaybookStep["suggestedActions"];
  communication_channels: PlaybookStep["communicationChannels"];
  position: number;
  status: PlaybookStep["status"];
  documents?:
    | {
        document_id: string;
        document?: { title: string; category?: { name: string } | null } | null;
      }[]
    | null;
}

export async function listStepsForPlaybook(
  supabase: SupabaseClient,
  playbookId: string,
): Promise<PlaybookStep[]> {
  const { data, error } = await supabase
    .from("crm_playbook_steps")
    .select(`
      id, playbook_id, title, description, objective, checklist, estimated_minutes, notes,
      links, files, scripts, best_practices, common_mistakes, approval_criteria,
      rejection_criteria, suggested_actions, communication_channels, position, status,
      documents:crm_playbook_step_documents!crm_playbook_step_documents_playbook_step_id_fkey(
        document_id,
        document:crm_knowledge_documents!crm_playbook_step_documents_document_id_fkey(
          title,
          category:crm_knowledge_categories!crm_knowledge_documents_category_id_fkey(name)
        )
      )
    `)
    .eq("playbook_id", playbookId)
    .order("position", { ascending: true });

  if (error) throw new Error(`Falha ao carregar etapas do playbook: ${error.message}`);

  return ((data ?? []) as unknown as StepRow[]).map((row) => ({
    id: row.id,
    playbookId: row.playbook_id,
    title: row.title,
    description: row.description,
    objective: row.objective,
    checklist: row.checklist ?? [],
    estimatedMinutes: row.estimated_minutes,
    notes: row.notes,
    links: row.links ?? [],
    files: row.files ?? [],
    scripts: row.scripts ?? [],
    bestPractices: row.best_practices ?? [],
    commonMistakes: row.common_mistakes ?? [],
    approvalCriteria: row.approval_criteria ?? [],
    rejectionCriteria: row.rejection_criteria ?? [],
    suggestedActions: row.suggested_actions ?? [],
    communicationChannels: row.communication_channels ?? [],
    position: row.position,
    status: row.status,
    linkedDocuments: (row.documents ?? []).map((item) => ({
      documentId: item.document_id,
      title: item.document?.title ?? "Documento",
      categoryName: item.document?.category?.name ?? null,
    })),
  }));
}
