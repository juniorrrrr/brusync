import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChannelType,
  Conversation,
  ConversationStatus,
  MessageDirection,
} from "@/types/communication";

interface ConversationRow {
  id: string;
  created_at: string;
  updated_at: string;
  channel_id: string;
  crm_lead_id: string | null;
  client_id: string | null;
  owner_id: string | null;
  status: ConversationStatus;
  is_favorite: boolean;
  is_archived: boolean;
  contact_name: string | null;
  contact_handle: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_direction: MessageDirection | null;
  unread_count: number;
  channel: { type: ChannelType; name: string } | null;
  crmLead: {
    name: string;
    city: string | null;
    origin: string | null;
    sourceLead: { utm_campaign: string | null } | null;
  } | null;
  client: { company: string } | null;
  owner: { name: string | null; email: string | null } | null;
}

const CONVERSATION_SELECT = `
  id, created_at, updated_at, channel_id, crm_lead_id, client_id, owner_id, status,
  is_favorite, is_archived, contact_name, contact_handle,
  last_message_at, last_message_preview, last_message_direction, unread_count,
  channel:crm_channels!crm_conversations_channel_id_fkey (type, name),
  crmLead:crm_leads!crm_conversations_crm_lead_id_fkey (
    name, city, origin,
    sourceLead:leads!crm_leads_source_lead_id_fkey (utm_campaign)
  ),
  client:clients!crm_conversations_client_id_fkey (company),
  owner:profiles!crm_conversations_owner_id_fkey (name, email)
`;

function mapConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    channelId: row.channel_id,
    channelType: row.channel?.type ?? "outro",
    channelName: row.channel?.name ?? "—",
    crmLeadId: row.crm_lead_id,
    crmLeadName: row.crmLead?.name ?? null,
    clientId: row.client_id,
    clientCompany: row.client?.company ?? null,
    ownerId: row.owner_id,
    ownerName: row.owner?.name ?? row.owner?.email ?? null,
    status: row.status,
    isFavorite: row.is_favorite,
    isArchived: row.is_archived,
    contactName: row.contact_name,
    contactHandle: row.contact_handle,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
    lastMessageDirection: row.last_message_direction,
    unreadCount: row.unread_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListConversationsOptions {
  channelId?: string;
  ownerId?: string;
  status?: ConversationStatus;
  unreadOnly?: boolean;
  archived?: boolean;
  favorite?: boolean;
  origin?: string;
  campaign?: string;
  city?: string;
  search?: string;
}

/** Channel/owner/status/unread/archived/favorite filter directly in the
 * query; origin/campaign/city/search are applied after the fetch since they
 * live on the nested lead/campaign embed — fine at this app's scale (an
 * internal inbox, not a mass-messaging platform), same trade-off already
 * made for the Financial dashboard's breakdowns. */
export async function listConversations(
  supabase: SupabaseClient,
  options: ListConversationsOptions = {},
): Promise<Conversation[]> {
  let query = supabase.from("crm_conversations").select(CONVERSATION_SELECT);

  if (options.channelId) query = query.eq("channel_id", options.channelId);
  if (options.ownerId) query = query.eq("owner_id", options.ownerId);
  if (options.status) query = query.eq("status", options.status);
  if (options.unreadOnly) query = query.gt("unread_count", 0);
  if (options.archived !== undefined) query = query.eq("is_archived", options.archived);
  if (options.favorite) query = query.eq("is_favorite", true);

  const { data, error } = await query.order("last_message_at", {
    ascending: false,
    nullsFirst: false,
  });

  if (error) throw new Error(`Falha ao carregar conversas: ${error.message}`);

  let pairs = ((data ?? []) as unknown as ConversationRow[]).map((row) => ({
    row,
    conversation: mapConversation(row),
  }));

  if (options.origin) {
    const term = options.origin.toLowerCase();
    pairs = pairs.filter((p) => p.row.crmLead?.origin?.toLowerCase().includes(term));
  }
  if (options.city) {
    const term = options.city.toLowerCase();
    pairs = pairs.filter((p) => p.row.crmLead?.city?.toLowerCase().includes(term));
  }
  if (options.campaign) {
    const term = options.campaign.toLowerCase();
    pairs = pairs.filter((p) =>
      p.row.crmLead?.sourceLead?.utm_campaign?.toLowerCase().includes(term),
    );
  }
  if (options.search) {
    const term = options.search.toLowerCase();
    pairs = pairs.filter(
      (p) =>
        p.conversation.crmLeadName?.toLowerCase().includes(term) ||
        p.conversation.clientCompany?.toLowerCase().includes(term) ||
        p.conversation.contactName?.toLowerCase().includes(term) ||
        p.conversation.lastMessagePreview?.toLowerCase().includes(term),
    );
  }

  return pairs.map((p) => p.conversation);
}

export async function listConversationsForLead(
  supabase: SupabaseClient,
  crmLeadId: string,
): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("crm_conversations")
    .select(CONVERSATION_SELECT)
    .eq("crm_lead_id", crmLeadId)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`Falha ao carregar conversas do lead: ${error.message}`);
  return ((data ?? []) as unknown as ConversationRow[]).map(mapConversation);
}

export async function listConversationsForClient(
  supabase: SupabaseClient,
  clientId: string,
): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("crm_conversations")
    .select(CONVERSATION_SELECT)
    .eq("client_id", clientId)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`Falha ao carregar conversas do cliente: ${error.message}`);
  return ((data ?? []) as unknown as ConversationRow[]).map(mapConversation);
}

export async function getConversationById(
  supabase: SupabaseClient,
  id: string,
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from("crm_conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar conversa: ${error.message}`);
  return data ? mapConversation(data as unknown as ConversationRow) : null;
}

export interface CreateConversationPayload {
  channelId: string;
  crmLeadId: string | null;
  clientId: string | null;
  ownerId: string | null;
  contactName: string | null;
  contactHandle: string | null;
  createdBy: string | null;
}

export async function createConversation(
  supabase: SupabaseClient,
  payload: CreateConversationPayload,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("crm_conversations")
    .insert({
      channel_id: payload.channelId,
      crm_lead_id: payload.crmLeadId,
      client_id: payload.clientId,
      owner_id: payload.ownerId,
      contact_name: payload.contactName,
      contact_handle: payload.contactHandle,
      created_by: payload.createdBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar conversa: ${error.message}`);
  return data as { id: string };
}

export interface UpdateConversationPayload {
  ownerId?: string | null;
  status?: ConversationStatus;
  isFavorite?: boolean;
  isArchived?: boolean;
  unreadCount?: number;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastMessageDirection?: MessageDirection;
}

export async function updateConversation(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateConversationPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.ownerId !== undefined) payload.owner_id = patch.ownerId;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.isFavorite !== undefined) payload.is_favorite = patch.isFavorite;
  if (patch.isArchived !== undefined) payload.is_archived = patch.isArchived;
  if (patch.unreadCount !== undefined) payload.unread_count = patch.unreadCount;
  if (patch.lastMessageAt !== undefined) payload.last_message_at = patch.lastMessageAt;
  if (patch.lastMessagePreview !== undefined)
    payload.last_message_preview = patch.lastMessagePreview;
  if (patch.lastMessageDirection !== undefined)
    payload.last_message_direction = patch.lastMessageDirection;

  const { error } = await supabase.from("crm_conversations").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar conversa: ${error.message}`);
}
