import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortalMessage, PortalMessageAuthorType } from "@/types/clientPortal";

interface PortalMessageRow {
  id: string;
  project_id: string;
  author_type: PortalMessageAuthorType;
  author_profile_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
}

const PORTAL_MESSAGE_SELECT = `
  id, project_id, author_type, author_profile_id, author_name, body, created_at
`;

function mapMessage(row: PortalMessageRow): PortalMessage {
  return {
    id: row.id,
    projectId: row.project_id,
    authorType: row.author_type,
    authorProfileId: row.author_profile_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

/** RLS scopes this to either the internal staff role or a portal user whose
 * client_id owns the project — same table, two disjoint audiences. */
export async function listMessagesForProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<PortalMessage[]> {
  const { data, error } = await supabase
    .from("crm_client_portal_messages")
    .select(PORTAL_MESSAGE_SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Falha ao carregar mensagens do projeto: ${error.message}`);
  return ((data ?? []) as unknown as PortalMessageRow[]).map(mapMessage);
}

export interface ListMessagesForProjectsResult {
  [projectId: string]: PortalMessage[];
}

export async function listMessagesForProjects(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<ListMessagesForProjectsResult> {
  if (projectIds.length === 0) return {};

  const { data, error } = await supabase
    .from("crm_client_portal_messages")
    .select(PORTAL_MESSAGE_SELECT)
    .in("project_id", projectIds)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Falha ao carregar mensagens dos projetos: ${error.message}`);

  const grouped: ListMessagesForProjectsResult = {};
  for (const row of (data ?? []) as unknown as PortalMessageRow[]) {
    const message = mapMessage(row);
    if (!grouped[message.projectId]) grouped[message.projectId] = [];
    grouped[message.projectId].push(message);
  }
  return grouped;
}

export async function createMessage(
  supabase: SupabaseClient,
  params: {
    projectId: string;
    authorType: PortalMessageAuthorType;
    authorProfileId: string;
    authorName: string;
    body: string;
  },
): Promise<PortalMessage> {
  const { data, error } = await supabase
    .from("crm_client_portal_messages")
    .insert({
      project_id: params.projectId,
      author_type: params.authorType,
      author_profile_id: params.authorProfileId,
      author_name: params.authorName,
      body: params.body,
    })
    .select(PORTAL_MESSAGE_SELECT)
    .single();

  if (error) throw new Error(`Falha ao enviar mensagem: ${error.message}`);
  return mapMessage(data as unknown as PortalMessageRow);
}
