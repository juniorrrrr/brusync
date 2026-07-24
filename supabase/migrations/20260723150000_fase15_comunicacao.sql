-- ============================================================================
-- Brusync OS — Fase 15: Central de Comunicação.
--
-- Aditivo apenas — nenhuma tabela existente é alterada, exceto a extensão
-- (já precedente desde a Fase 3) da constraint de tipos de
-- crm_lead_activities, para que "Mensagem enviada/recebida", "Conversa
-- iniciada/encerrada" e "Responsável alterado" apareçam na Timeline do Lead
-- exatamente como qualquer outro evento do CRM.
--
-- Esta fase NÃO integra nenhuma API real (WhatsApp, Meta, Evolution API
-- etc.) — apenas prepara a arquitetura e o schema para recebê-las depois,
-- sem precisar refatorar nenhuma tela. Por isso toda mensagem hoje é
-- inserida manualmente (enviada pelo atendente ou registrada como recebida).
--
-- Cinco tabelas, um conceito cada:
--   crm_channels             → canais possíveis (WhatsApp, WhatsApp Business
--                              Cloud API, Evolution API, Messenger, Instagram
--                              Direct, E-mail, Telefone, Chat interno),
--                              seedados como configuração, não como enum
--                              fixo no código — uma futura integração real só
--                              precisa ativar/configurar a linha existente.
--   crm_conversations        → uma conversa, sempre ligada a um Lead OU um
--                              Cliente (nunca nenhum dos dois, nunca ambos
--                              obrigatoriamente — mas ao menos um).
--   crm_messages             → mensagens de uma conversa (inbound/outbound).
--   crm_message_templates    → modelos de mensagem reutilizáveis no composer.
--   crm_message_events       → log append-only de eventos da conversa
--                              (iniciada, encerrada, responsável alterado,
--                              mensagem enviada/recebida) — histórico da
--                              própria conversa, complementar (não substitui)
--                              à Timeline geral do Lead.
-- ============================================================================

create table if not exists public.crm_channels (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  type text not null check (type in (
    'whatsapp', 'whatsapp_business_api', 'evolution_api', 'messenger',
    'instagram_direct', 'email', 'phone', 'internal', 'outro'
  )),
  name text not null,
  is_active boolean not null default true
);

alter table public.crm_channels enable row level security;

create unique index if not exists crm_channels_type_name_idx on public.crm_channels (type, name);

drop policy if exists "Equipe interna lê crm_channels" on public.crm_channels;
create policy "Equipe interna lê crm_channels"
  on public.crm_channels for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_channels" on public.crm_channels;
create policy "Equipe interna cria crm_channels"
  on public.crm_channels for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_channels" on public.crm_channels;
create policy "Equipe interna atualiza crm_channels"
  on public.crm_channels for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_channels" on public.crm_channels;
create policy "Equipe interna apaga crm_channels"
  on public.crm_channels for delete
  using (public.is_internal_staff());

insert into public.crm_channels (type, name) values
  ('whatsapp', 'WhatsApp'),
  ('whatsapp_business_api', 'WhatsApp Business Cloud API'),
  ('evolution_api', 'Evolution API'),
  ('messenger', 'Messenger'),
  ('instagram_direct', 'Instagram Direct'),
  ('email', 'E-mail'),
  ('phone', 'Telefone'),
  ('internal', 'Chat interno')
on conflict (type, name) do nothing;

-- ----------------------------------------------------------------------------
create table if not exists public.crm_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  channel_id uuid not null references public.crm_channels (id),
  crm_lead_id uuid references public.crm_leads (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,

  owner_id uuid references public.profiles (id) on delete set null,
  status text not null default 'aberta' check (status in ('aberta', 'pendente', 'encerrada')),
  is_favorite boolean not null default false,
  is_archived boolean not null default false,

  contact_name text,
  contact_handle text,

  last_message_at timestamptz,
  last_message_preview text,
  last_message_direction text check (last_message_direction in ('inbound', 'outbound')),
  unread_count integer not null default 0,

  created_by uuid references public.profiles (id) on delete set null,

  constraint crm_conversations_subject_check check (crm_lead_id is not null or client_id is not null)
);

alter table public.crm_conversations enable row level security;

create index if not exists crm_conversations_lead_idx on public.crm_conversations (crm_lead_id);
create index if not exists crm_conversations_client_idx on public.crm_conversations (client_id);
create index if not exists crm_conversations_owner_idx on public.crm_conversations (owner_id);
create index if not exists crm_conversations_channel_idx on public.crm_conversations (channel_id);
create index if not exists crm_conversations_status_idx on public.crm_conversations (status);
create index if not exists crm_conversations_last_message_idx
  on public.crm_conversations (last_message_at desc nulls last);

drop trigger if exists set_crm_conversations_updated_at on public.crm_conversations;
create trigger set_crm_conversations_updated_at
  before update on public.crm_conversations
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_conversations" on public.crm_conversations;
create policy "Equipe interna lê crm_conversations"
  on public.crm_conversations for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_conversations" on public.crm_conversations;
create policy "Equipe interna cria crm_conversations"
  on public.crm_conversations for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_conversations" on public.crm_conversations;
create policy "Equipe interna atualiza crm_conversations"
  on public.crm_conversations for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_conversations" on public.crm_conversations;
create policy "Equipe interna apaga crm_conversations"
  on public.crm_conversations for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
create table if not exists public.crm_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  conversation_id uuid not null references public.crm_conversations (id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,

  sender_profile_id uuid references public.profiles (id) on delete set null,
  sender_name text,

  metadata jsonb
);

alter table public.crm_messages enable row level security;

create index if not exists crm_messages_conversation_idx
  on public.crm_messages (conversation_id, created_at);

drop policy if exists "Equipe interna lê crm_messages" on public.crm_messages;
create policy "Equipe interna lê crm_messages"
  on public.crm_messages for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_messages" on public.crm_messages;
create policy "Equipe interna cria crm_messages"
  on public.crm_messages for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_messages" on public.crm_messages;
create policy "Equipe interna apaga crm_messages"
  on public.crm_messages for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
create table if not exists public.crm_message_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  body text not null,
  channel_type text check (channel_type in (
    'whatsapp', 'whatsapp_business_api', 'evolution_api', 'messenger',
    'instagram_direct', 'email', 'phone', 'internal', 'outro'
  )),

  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_message_templates enable row level security;

drop trigger if exists set_crm_message_templates_updated_at on public.crm_message_templates;
create trigger set_crm_message_templates_updated_at
  before update on public.crm_message_templates
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_message_templates" on public.crm_message_templates;
create policy "Equipe interna lê crm_message_templates"
  on public.crm_message_templates for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_message_templates" on public.crm_message_templates;
create policy "Equipe interna cria crm_message_templates"
  on public.crm_message_templates for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_message_templates" on public.crm_message_templates;
create policy "Equipe interna atualiza crm_message_templates"
  on public.crm_message_templates for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_message_templates" on public.crm_message_templates;
create policy "Equipe interna apaga crm_message_templates"
  on public.crm_message_templates for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Somente leitura e inserção — nunca update, nunca delete, mesmo padrão de
-- crm_lead_journey_events: o histórico de uma conversa nunca pode ser
-- reescrito.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_message_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  conversation_id uuid not null references public.crm_conversations (id) on delete cascade,
  type text not null check (type in (
    'conversation_started', 'conversation_closed', 'conversation_reopened',
    'message_sent', 'message_received', 'owner_changed', 'status_changed',
    'favorited', 'unfavorited', 'archived', 'unarchived'
  )),
  actor_id uuid references public.profiles (id) on delete set null,
  metadata jsonb
);

alter table public.crm_message_events enable row level security;

create index if not exists crm_message_events_conversation_idx
  on public.crm_message_events (conversation_id, created_at);

drop policy if exists "Equipe interna lê crm_message_events" on public.crm_message_events;
create policy "Equipe interna lê crm_message_events"
  on public.crm_message_events for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_message_events" on public.crm_message_events;
create policy "Equipe interna cria crm_message_events"
  on public.crm_message_events for insert
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Extensão aditiva da Timeline geral do Lead (mesmo mecanismo já usado nas
-- Fases 3/5/12): toda interação de uma conversa ligada a um Lead também
-- aparece na Timeline do Lead Workspace, ao lado dos demais eventos do CRM.
-- ----------------------------------------------------------------------------
alter table public.crm_lead_activities drop constraint if exists crm_lead_activities_type_check;
alter table public.crm_lead_activities add constraint crm_lead_activities_type_check
  check (type in (
    'note', 'stage_change', 'call', 'email', 'meeting', 'task', 'system',
    'lead_updated', 'owner_change',
    'note_created', 'note_updated', 'note_deleted',
    'task_created', 'task_updated', 'task_completed', 'task_deleted',
    'file_upload', 'file_delete',
    'automation', 'lead_lost', 'lead_reopened', 'client_created',
    'conversation_started', 'conversation_closed',
    'message_sent', 'message_received', 'conversation_owner_changed'
  ));
