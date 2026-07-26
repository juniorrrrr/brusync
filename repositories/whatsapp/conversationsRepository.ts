import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  WhatsappContact,
  WhatsappConversation,
  WhatsappConversationStatus,
  WhatsappLabel,
} from "@/types/whatsapp";

interface ConversationRow {
  id: string;
  created_at: string;
  updated_at: string;
  account_id: string;
  status: WhatsappConversationStatus;
  is_favorite: boolean;
  is_archived: boolean;
  owner_id: string | null;
  crm_lead_id: string | null;
  client_id: string | null;
  project_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  contact: {
    id: string;
    account_id: string;
    wa_id: string;
    profile_name: string | null;
    phone_number: string;
    crm_lead_id: string | null;
    client_id: string | null;
    opted_in: boolean;
    created_at: string;
  };
  owner: { name: string | null; email: string | null } | null;
  lead: { name: string } | null;
  client: { company: string } | null;
  project: { name: string } | null;
  label_links: { label: { id: string; name: string; color: string } }[];
}

const CONVERSATION_SELECT = `
  id, created_at, updated_at, account_id, status, is_favorite, is_archived, owner_id,
  crm_lead_id, client_id, project_id, last_message_at, last_message_preview, unread_count,
  contact:whatsapp_contacts!whatsapp_conversations_contact_id_fkey (
    id, account_id, wa_id, profile_name, phone_number, crm_lead_id, client_id, opted_in, created_at
  ),
  owner:profiles!whatsapp_conversations_owner_id_fkey (name, email),
  lead:crm_leads!whatsapp_conversations_crm_lead_id_fkey (name),
  client:clients!whatsapp_conversations_client_id_fkey (company),
  project:crm_projects!whatsapp_conversations_project_id_fkey (name),
  label_links:whatsapp_conversation_labels (label:whatsapp_labels (id, name, color))
`;

function mapContact(row: ConversationRow["contact"]): WhatsappContact {
  return {
    id: row.id,
    accountId: row.account_id,
    waId: row.wa_id,
    profileName: row.profile_name,
    phoneNumber: row.phone_number,
    crmLeadId: row.crm_lead_id,
    clientId: row.client_id,
    optedIn: row.opted_in,
    createdAt: row.created_at,
  };
}

function mapConversation(row: ConversationRow): WhatsappConversation {
  const labels: WhatsappLabel[] = (row.label_links ?? []).map((link) => link.label);
  return {
    id: row.id,
    accountId: row.account_id,
    contact: mapContact(row.contact),
    status: row.status,
    isFavorite: row.is_favorite,
    isArchived: row.is_archived,
    ownerId: row.owner_id,
    ownerName: row.owner?.name ?? row.owner?.email ?? null,
    crmLeadId: row.crm_lead_id,
    crmLeadName: row.lead?.name ?? null,
    clientId: row.client_id,
    clientCompany: row.client?.company ?? null,
    projectId: row.project_id,
    projectName: row.project?.name ?? null,
    labels,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
    lastMessageDirection: null,
    unreadCount: row.unread_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListConversationsOptions {
  status?: WhatsappConversationStatus;
  favoritesOnly?: boolean;
  unreadOnly?: boolean;
  archivedOnly?: boolean;
  ownerId?: string;
  search?: string;
}

export async function listConversations(
  supabase: SupabaseClient,
  options: ListConversationsOptions = {},
): Promise<WhatsappConversation[]> {
  let query = supabase.from("whatsapp_conversations").select(CONVERSATION_SELECT);

  query = query.eq("is_archived", options.archivedOnly ?? false);
  if (options.status) query = query.eq("status", options.status);
  if (options.favoritesOnly) query = query.eq("is_favorite", true);
  if (options.unreadOnly) query = query.gt("unread_count", 0);
  if (options.ownerId) query = query.eq("owner_id", options.ownerId);

  query = query.order("last_message_at", { ascending: false, nullsFirst: false });

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar conversas do WhatsApp: ${error.message}`);
  let conversations = ((data ?? []) as unknown as ConversationRow[]).map(mapConversation);

  if (options.search) {
    const term = options.search.toLowerCase();
    conversations = conversations.filter(
      (c) =>
        (c.contact.profileName ?? "").toLowerCase().includes(term) ||
        c.contact.phoneNumber.includes(term) ||
        (c.crmLeadName ?? "").toLowerCase().includes(term) ||
        (c.clientCompany ?? "").toLowerCase().includes(term),
    );
  }

  return conversations;
}

export async function getConversationById(
  supabase: SupabaseClient,
  id: string,
): Promise<WhatsappConversation | null> {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar conversa: ${error.message}`);
  if (!data) return null;
  return mapConversation(data as unknown as ConversationRow);
}

export async function getConversationByContactId(
  supabase: SupabaseClient,
  contactId: string,
): Promise<WhatsappConversation | null> {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .select(CONVERSATION_SELECT)
    .eq("contact_id", contactId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar conversa do contato: ${error.message}`);
  if (!data) return null;
  return mapConversation(data as unknown as ConversationRow);
}

export async function createConversation(
  supabase: SupabaseClient,
  accountId: string,
  contactId: string,
): Promise<WhatsappConversation> {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .insert({ account_id: accountId, contact_id: contactId })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar conversa: ${error.message}`);
  const created = await getConversationById(supabase, (data as { id: string }).id);
  if (!created) throw new Error("Conversa criada, mas não encontrada.");
  return created;
}

export interface UpdateConversationPayload {
  status?: WhatsappConversationStatus;
  isFavorite?: boolean;
  isArchived?: boolean;
  ownerId?: string | null;
  crmLeadId?: string | null;
  clientId?: string | null;
  projectId?: string | null;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount?: number;
}

export async function updateConversation(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateConversationPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.isFavorite !== undefined) payload.is_favorite = patch.isFavorite;
  if (patch.isArchived !== undefined) payload.is_archived = patch.isArchived;
  if (patch.ownerId !== undefined) payload.owner_id = patch.ownerId;
  if (patch.crmLeadId !== undefined) payload.crm_lead_id = patch.crmLeadId;
  if (patch.clientId !== undefined) payload.client_id = patch.clientId;
  if (patch.projectId !== undefined) payload.project_id = patch.projectId;
  if (patch.lastMessageAt !== undefined) payload.last_message_at = patch.lastMessageAt;
  if (patch.lastMessagePreview !== undefined)
    payload.last_message_preview = patch.lastMessagePreview;
  if (patch.unreadCount !== undefined) payload.unread_count = patch.unreadCount;

  const { error } = await supabase.from("whatsapp_conversations").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar conversa: ${error.message}`);
}

export async function setConversationLabels(
  supabase: SupabaseClient,
  conversationId: string,
  labelIds: string[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("whatsapp_conversation_labels")
    .delete()
    .eq("conversation_id", conversationId);
  if (deleteError) throw new Error(`Falha ao atualizar etiquetas: ${deleteError.message}`);

  if (labelIds.length === 0) return;
  const { error: insertError } = await supabase
    .from("whatsapp_conversation_labels")
    .insert(labelIds.map((labelId) => ({ conversation_id: conversationId, label_id: labelId })));
  if (insertError) throw new Error(`Falha ao atualizar etiquetas: ${insertError.message}`);
}
