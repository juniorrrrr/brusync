-- ============================================================================
-- Brusync OS — Fase 28: WhatsApp Business Cloud API (Meta Oficial).
--
-- Aditivo apenas. Este módulo é intencionalmente uma superfície NOVA e
-- própria (whatsapp_conversations/whatsapp_messages, não uma extensão de
-- crm_conversations/crm_messages da Fase 15) porque a Cloud API da Meta tem
-- conceitos que a Comunicação genérica não modela — status de entrega por
-- wamid, aprovação de template pela Meta, mídia por media_id — e a
-- instrução desta fase é explícita: "nenhum módulo atual deve ser
-- refatorado". O vínculo com CRM (lead/cliente/projeto) é só uma referência
-- (foreign key), nunca duplicação de dado ou de regra.
--
-- Token de acesso, verify token do webhook e app secret são guardados
-- cifrados com a MESMA rotina AES-256-GCM da Fase 9
-- (services/metaConversionsApi/tokenCrypto.ts — reaproveitada, não
-- duplicada), chaveada por META_TOKEN_ENCRYPTION_KEY.
-- ============================================================================

create table if not exists public.whatsapp_accounts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  phone_number_id text not null unique,
  waba_id text not null,
  display_phone_number text,
  display_name text,

  access_token_ciphertext text,
  access_token_iv text,
  webhook_verify_token_ciphertext text,
  webhook_verify_token_iv text,
  app_secret_ciphertext text,
  app_secret_iv text,

  status text not null default 'desconectado' check (status in ('conectado', 'desconectado', 'erro')),
  last_sync_at timestamptz,
  error text,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.whatsapp_accounts enable row level security;

drop trigger if exists set_whatsapp_accounts_updated_at on public.whatsapp_accounts;
create trigger set_whatsapp_accounts_updated_at
  before update on public.whatsapp_accounts
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê whatsapp_accounts" on public.whatsapp_accounts;
create policy "Equipe interna lê whatsapp_accounts"
  on public.whatsapp_accounts for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia whatsapp_accounts" on public.whatsapp_accounts;
create policy "Equipe interna gerencia whatsapp_accounts"
  on public.whatsapp_accounts for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Contatos — um por wa_id (número de telefone no formato da Meta) por
-- conta. Referências a lead/cliente são só FK, nunca cópia de nome/telefone.
-- ----------------------------------------------------------------------------
create table if not exists public.whatsapp_contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  account_id uuid not null references public.whatsapp_accounts (id) on delete cascade,
  wa_id text not null,
  profile_name text,
  phone_number text not null,
  crm_lead_id uuid references public.crm_leads (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  opted_in boolean not null default true,

  unique (account_id, wa_id)
);

alter table public.whatsapp_contacts enable row level security;

create index if not exists whatsapp_contacts_lead_idx on public.whatsapp_contacts (crm_lead_id);
create index if not exists whatsapp_contacts_client_idx on public.whatsapp_contacts (client_id);

drop policy if exists "Equipe interna lê whatsapp_contacts" on public.whatsapp_contacts;
create policy "Equipe interna lê whatsapp_contacts"
  on public.whatsapp_contacts for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia whatsapp_contacts" on public.whatsapp_contacts;
create policy "Equipe interna gerencia whatsapp_contacts"
  on public.whatsapp_contacts for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Conversas.
-- ----------------------------------------------------------------------------
create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  account_id uuid not null references public.whatsapp_accounts (id) on delete cascade,
  contact_id uuid not null references public.whatsapp_contacts (id) on delete cascade,
  status text not null default 'aberta' check (status in ('aberta', 'pendente', 'encerrada')),
  is_favorite boolean not null default false,
  is_archived boolean not null default false,
  owner_id uuid references public.profiles (id) on delete set null,
  crm_lead_id uuid references public.crm_leads (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  project_id uuid references public.crm_projects (id) on delete set null,
  last_message_at timestamptz,
  last_message_preview text,
  unread_count integer not null default 0
);

alter table public.whatsapp_conversations enable row level security;

create index if not exists whatsapp_conversations_account_idx
  on public.whatsapp_conversations (account_id, last_message_at desc);
create index if not exists whatsapp_conversations_owner_idx on public.whatsapp_conversations (owner_id);
create index if not exists whatsapp_conversations_status_idx on public.whatsapp_conversations (status);

drop trigger if exists set_whatsapp_conversations_updated_at on public.whatsapp_conversations;
create trigger set_whatsapp_conversations_updated_at
  before update on public.whatsapp_conversations
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê whatsapp_conversations" on public.whatsapp_conversations;
create policy "Equipe interna lê whatsapp_conversations"
  on public.whatsapp_conversations for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia whatsapp_conversations" on public.whatsapp_conversations;
create policy "Equipe interna gerencia whatsapp_conversations"
  on public.whatsapp_conversations for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Templates — sincronizados da Meta (listApprovedTemplates) ou cadastrados
-- localmente como rascunho antes de existir na Meta.
-- ----------------------------------------------------------------------------
create table if not exists public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  account_id uuid not null references public.whatsapp_accounts (id) on delete cascade,
  name text not null,
  category text not null default 'utility' check (category in ('marketing', 'utility', 'authentication')),
  language text not null default 'pt_BR',
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'rejeitado')),
  components jsonb not null default '[]'::jsonb,
  meta_template_id text,

  unique (account_id, name, language)
);

alter table public.whatsapp_templates enable row level security;

drop trigger if exists set_whatsapp_templates_updated_at on public.whatsapp_templates;
create trigger set_whatsapp_templates_updated_at
  before update on public.whatsapp_templates
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê whatsapp_templates" on public.whatsapp_templates;
create policy "Equipe interna lê whatsapp_templates"
  on public.whatsapp_templates for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia whatsapp_templates" on public.whatsapp_templates;
create policy "Equipe interna gerencia whatsapp_templates"
  on public.whatsapp_templates for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Anexos — arquivo primeiro (upload/download), a mensagem referencia o
-- anexo já existente (mesmo padrão de repositories/projects/
-- projectFilesRepository.ts: bucket + signed URL, nunca o binário na
-- tabela).
-- ----------------------------------------------------------------------------
create table if not exists public.whatsapp_attachments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  conversation_id uuid references public.whatsapp_conversations (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  kind text not null default 'documento' check (kind in ('imagem', 'video', 'documento', 'audio')),
  uploaded_by uuid references public.profiles (id) on delete set null
);

alter table public.whatsapp_attachments enable row level security;

create index if not exists whatsapp_attachments_conversation_idx
  on public.whatsapp_attachments (conversation_id);

drop policy if exists "Equipe interna lê whatsapp_attachments" on public.whatsapp_attachments;
create policy "Equipe interna lê whatsapp_attachments"
  on public.whatsapp_attachments for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia whatsapp_attachments" on public.whatsapp_attachments;
create policy "Equipe interna gerencia whatsapp_attachments"
  on public.whatsapp_attachments for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Mensagens.
-- ----------------------------------------------------------------------------
create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  conversation_id uuid not null references public.whatsapp_conversations (id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  type text not null default 'texto' check (type in (
    'texto', 'imagem', 'video', 'documento', 'audio', 'localizacao', 'contato', 'template'
  )),
  body text,
  attachment_id uuid references public.whatsapp_attachments (id) on delete set null,
  template_id uuid references public.whatsapp_templates (id) on delete set null,
  wa_message_id text unique,
  status text not null default 'pendente' check (status in ('pendente', 'enviado', 'entregue', 'lido', 'falhou')),
  error text,
  sender_profile_id uuid references public.profiles (id) on delete set null
);

alter table public.whatsapp_messages enable row level security;

create index if not exists whatsapp_messages_conversation_idx
  on public.whatsapp_messages (conversation_id, created_at);
create index if not exists whatsapp_messages_wa_message_idx on public.whatsapp_messages (wa_message_id);

drop policy if exists "Equipe interna lê whatsapp_messages" on public.whatsapp_messages;
create policy "Equipe interna lê whatsapp_messages"
  on public.whatsapp_messages for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia whatsapp_messages" on public.whatsapp_messages;
create policy "Equipe interna gerencia whatsapp_messages"
  on public.whatsapp_messages for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Etiquetas — catálogo + vínculo N:N com conversas.
-- ----------------------------------------------------------------------------
create table if not exists public.whatsapp_labels (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null unique,
  color text not null default '#25d0c3'
);

alter table public.whatsapp_labels enable row level security;

drop policy if exists "Equipe interna lê whatsapp_labels" on public.whatsapp_labels;
create policy "Equipe interna lê whatsapp_labels"
  on public.whatsapp_labels for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia whatsapp_labels" on public.whatsapp_labels;
create policy "Equipe interna gerencia whatsapp_labels"
  on public.whatsapp_labels for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

create table if not exists public.whatsapp_conversation_labels (
  conversation_id uuid not null references public.whatsapp_conversations (id) on delete cascade,
  label_id uuid not null references public.whatsapp_labels (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, label_id)
);

alter table public.whatsapp_conversation_labels enable row level security;

drop policy if exists "Equipe interna lê whatsapp_conversation_labels" on public.whatsapp_conversation_labels;
create policy "Equipe interna lê whatsapp_conversation_labels"
  on public.whatsapp_conversation_labels for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia whatsapp_conversation_labels" on public.whatsapp_conversation_labels;
create policy "Equipe interna gerencia whatsapp_conversation_labels"
  on public.whatsapp_conversation_labels for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Automações — vínculo leve (gatilho → template); o DISPARO reaproveita a
-- Central de Automações existente (services/automation/automationEngine.ts
-- ganha um novo case 'enviar_whatsapp'; domain/automation/eventMap.ts ganha
-- entradas aditivas para os eventos já publicados que correspondem a estes
-- gatilhos) — nenhuma engine de automação nova é criada aqui.
-- ----------------------------------------------------------------------------
create table if not exists public.whatsapp_automations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  account_id uuid not null references public.whatsapp_accounts (id) on delete cascade,
  trigger_type text not null check (trigger_type in (
    'novo_lead', 'mudanca_pipeline', 'venda_concluida', 'pagamento_recebido',
    'projeto_iniciado', 'projeto_finalizado', 'agendamento_confirmado', 'aniversario', 'lembrete'
  )),
  template_id uuid references public.whatsapp_templates (id) on delete set null,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  config jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.whatsapp_automations enable row level security;

create index if not exists whatsapp_automations_trigger_idx on public.whatsapp_automations (trigger_type);

drop trigger if exists set_whatsapp_automations_updated_at on public.whatsapp_automations;
create trigger set_whatsapp_automations_updated_at
  before update on public.whatsapp_automations
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê whatsapp_automations" on public.whatsapp_automations;
create policy "Equipe interna lê whatsapp_automations"
  on public.whatsapp_automations for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia whatsapp_automations" on public.whatsapp_automations;
create policy "Equipe interna gerencia whatsapp_automations"
  on public.whatsapp_automations for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Log bruto de webhooks recebidos — auditoria completa, nunca fonte de
-- verdade (mesmo espírito de integration_events, Fase 6).
-- ----------------------------------------------------------------------------
create table if not exists public.whatsapp_webhooks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  account_id uuid references public.whatsapp_accounts (id) on delete set null,
  event_type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  error text
);

alter table public.whatsapp_webhooks enable row level security;

create index if not exists whatsapp_webhooks_created_at_idx on public.whatsapp_webhooks (created_at desc);

drop policy if exists "Equipe interna lê whatsapp_webhooks" on public.whatsapp_webhooks;
create policy "Equipe interna lê whatsapp_webhooks"
  on public.whatsapp_webhooks for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia whatsapp_webhooks" on public.whatsapp_webhooks;
create policy "Equipe interna gerencia whatsapp_webhooks"
  on public.whatsapp_webhooks for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Bucket Storage privado para anexos do WhatsApp — mesmo padrão de
-- crm-project-files (Fase 12): sem policy de update, acesso só por
-- is_internal_staff().
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('crm-whatsapp-attachments', 'crm-whatsapp-attachments', false)
on conflict (id) do nothing;

drop policy if exists "Equipe interna lê arquivos crm-whatsapp-attachments" on storage.objects;
create policy "Equipe interna lê arquivos crm-whatsapp-attachments"
  on storage.objects for select
  using (bucket_id = 'crm-whatsapp-attachments' and public.is_internal_staff());
drop policy if exists "Equipe interna envia arquivos crm-whatsapp-attachments" on storage.objects;
create policy "Equipe interna envia arquivos crm-whatsapp-attachments"
  on storage.objects for insert
  with check (bucket_id = 'crm-whatsapp-attachments' and public.is_internal_staff());
drop policy if exists "Equipe interna apaga arquivos crm-whatsapp-attachments" on storage.objects;
create policy "Equipe interna apaga arquivos crm-whatsapp-attachments"
  on storage.objects for delete
  using (bucket_id = 'crm-whatsapp-attachments' and public.is_internal_staff());
