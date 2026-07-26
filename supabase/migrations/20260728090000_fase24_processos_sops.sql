-- ============================================================================
-- Brusync OS — Fase 24: Processos e SOPs (Standard Operating Procedures).
--
-- Aditivo apenas — nenhuma tabela existente é alterada. Nove tabelas, cada
-- uma com um papel único (mesmo raciocínio "uma tabela, um conceito" da
-- Fase 18 — Base de Conhecimento):
--
--   crm_process_categories      → organização da lista de processos
--                                 (Comercial, Atendimento, Onboarding,
--                                 Financeiro, Projetos, Marketing, RH,
--                                 Operacional, Qualidade, TI + categorias
--                                 personalizadas), mesmo molde de
--                                 crm_knowledge_categories.
--   crm_processes                → o processo em si — nome, descrição,
--                                 categoria, responsável, status. Tempo
--                                 executado NUNCA é uma coluna própria —
--                                 é sempre derivado de started_at/
--                                 completed_at pela camada de domínio
--                                 (domain/processes/progress.ts), mesmo
--                                 princípio "nunca uma coluna redundante"
--                                 já usado no view_count da Fase 18.
--   crm_process_steps            → Etapas ordenadas de um processo
--                                 (equivalente a crm_project_phases da
--                                 Fase 12).
--   crm_process_checklist_items  → itens de checklist, presos a uma etapa
--                                 OU direto ao processo (step_id nulo).
--   crm_process_approvals        → solicitações de aprovação (do processo
--                                 inteiro ou de uma etapa específica) —
--                                 pendente/aprovado/reprovado.
--   crm_process_history          → log de auditoria, append-only (nunca
--                                 update/delete) — cada alteração relevante
--                                 gera uma linha aqui, é o requisito
--                                 explícito de "Histórico" da Fase 24,
--                                 diferente da Timeline computada por
--                                 timestamp usada nas Fases 12/18 (lá não
--                                 havia pedido de auditoria explícita;
--                                 aqui há).
--   crm_process_templates        → modelos reutilizáveis — a "receita" de
--                                 etapas+checklist vive em steps_blueprint
--                                 (jsonb), nunca materializada em tabelas
--                                 próprias antes de virar um processo real
--                                 (mesmo raciocínio de "comments" jsonb em
--                                 crm_project_tasks da Fase 12, evita duas
--                                 tabelas extras só para o "molde").
--   crm_process_documents         → junção m:n para "Documentos
--                                 relacionados"/"Base de conhecimento
--                                 relacionada" — aponta para
--                                 crm_knowledge_documents já existente,
--                                 nunca duplica conteúdo/armazenamento da
--                                 Base de Conhecimento.
--   crm_process_files             → upload próprio do processo (ex.: uma
--                                 evidência que não é um documento formal
--                                 da Base de Conhecimento) — metadados
--                                 aqui, binário no bucket Storage privado
--                                 crm-process-files, mesmo padrão de
--                                 crm_project_files/crm_knowledge_files.
--
-- Vínculos de negócio opcionais em crm_processes (Cliente/Projeto/Lead),
-- sempre nullable e sem duplicar informação, igual ao padrão já usado em
-- crm_knowledge_documents.
-- ============================================================================

-- ----------------------------------------------------------------------------
create table if not exists public.crm_process_categories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  slug text not null,
  description text,
  icon text not null default 'folder',
  color text not null default 'neutral' check (color in ('info', 'warn', 'ok', 'neutral', 'danger')),
  is_default boolean not null default false,
  sort_order integer not null default 0,

  created_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

alter table public.crm_process_categories enable row level security;

create unique index if not exists crm_process_categories_slug_idx
  on public.crm_process_categories (slug) where deleted_at is null;

drop trigger if exists set_crm_process_categories_updated_at on public.crm_process_categories;
create trigger set_crm_process_categories_updated_at
  before update on public.crm_process_categories
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_process_categories" on public.crm_process_categories;
create policy "Equipe interna lê crm_process_categories"
  on public.crm_process_categories for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_process_categories" on public.crm_process_categories;
create policy "Equipe interna cria crm_process_categories"
  on public.crm_process_categories for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_process_categories" on public.crm_process_categories;
create policy "Equipe interna atualiza crm_process_categories"
  on public.crm_process_categories for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_process_categories" on public.crm_process_categories;
create policy "Equipe interna apaga crm_process_categories"
  on public.crm_process_categories for delete
  using (public.is_internal_staff() and not is_default);

insert into public.crm_process_categories (name, slug, icon, color, is_default, sort_order) values
  ('Comercial', 'comercial', 'target', 'info', true, 1),
  ('Atendimento', 'atendimento', 'message', 'info', true, 2),
  ('Onboarding', 'onboarding', 'check-circle', 'ok', true, 3),
  ('Financeiro', 'financeiro', 'wallet', 'ok', true, 4),
  ('Projetos', 'projetos', 'doc', 'info', true, 5),
  ('Marketing', 'marketing', 'report', 'warn', true, 6),
  ('RH', 'rh', 'users', 'neutral', true, 7),
  ('Operacional', 'operacional', 'bolt', 'neutral', true, 8),
  ('Qualidade', 'qualidade', 'tag', 'warn', true, 9),
  ('TI', 'ti', 'server', 'neutral', true, 10)
on conflict do nothing;

-- ----------------------------------------------------------------------------
create table if not exists public.crm_process_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  description text,
  category_id uuid references public.crm_process_categories (id) on delete set null,
  default_estimated_minutes integer,
  -- Array de {name, description, position, checklist: [{label, position}]} —
  -- o "molde" de etapas+checklist copiado ao instanciar um processo real.
  steps_blueprint jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,

  created_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

alter table public.crm_process_templates enable row level security;

create index if not exists crm_process_templates_category_idx on public.crm_process_templates (category_id);

drop trigger if exists set_crm_process_templates_updated_at on public.crm_process_templates;
create trigger set_crm_process_templates_updated_at
  before update on public.crm_process_templates
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_process_templates" on public.crm_process_templates;
create policy "Equipe interna lê crm_process_templates"
  on public.crm_process_templates for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_process_templates" on public.crm_process_templates;
create policy "Equipe interna cria crm_process_templates"
  on public.crm_process_templates for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_process_templates" on public.crm_process_templates;
create policy "Equipe interna atualiza crm_process_templates"
  on public.crm_process_templates for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_process_templates" on public.crm_process_templates;
create policy "Equipe interna apaga crm_process_templates"
  on public.crm_process_templates for delete
  using (public.is_internal_staff() and not is_default);

-- ----------------------------------------------------------------------------
create table if not exists public.crm_processes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  description text,
  category_id uuid references public.crm_process_categories (id) on delete set null,
  owner_id uuid references public.profiles (id) on delete set null,
  status text not null default 'rascunho' check (status in (
    'rascunho', 'ativo', 'pausado', 'aguardando_aprovacao', 'concluido', 'arquivado'
  )),

  estimated_minutes integer,
  started_at timestamptz,
  completed_at timestamptz,

  template_id uuid references public.crm_process_templates (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  project_id uuid references public.crm_projects (id) on delete set null,
  crm_lead_id uuid references public.crm_leads (id) on delete set null,

  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

alter table public.crm_processes enable row level security;

create index if not exists crm_processes_category_idx on public.crm_processes (category_id);
create index if not exists crm_processes_owner_idx on public.crm_processes (owner_id);
create index if not exists crm_processes_status_idx on public.crm_processes (status);
create index if not exists crm_processes_client_idx on public.crm_processes (client_id);
create index if not exists crm_processes_project_idx on public.crm_processes (project_id);
create index if not exists crm_processes_lead_idx on public.crm_processes (crm_lead_id);
create index if not exists crm_processes_updated_idx on public.crm_processes (updated_at desc);

drop trigger if exists set_crm_processes_updated_at on public.crm_processes;
create trigger set_crm_processes_updated_at
  before update on public.crm_processes
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_processes" on public.crm_processes;
create policy "Equipe interna lê crm_processes"
  on public.crm_processes for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_processes" on public.crm_processes;
create policy "Equipe interna cria crm_processes"
  on public.crm_processes for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_processes" on public.crm_processes;
create policy "Equipe interna atualiza crm_processes"
  on public.crm_processes for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_processes" on public.crm_processes;
create policy "Equipe interna apaga crm_processes"
  on public.crm_processes for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Etapas ordenadas (mesmo molde de crm_project_phases da Fase 12).
-- ----------------------------------------------------------------------------
create table if not exists public.crm_process_steps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  process_id uuid not null references public.crm_processes (id) on delete cascade,
  name text not null,
  description text,
  position integer not null default 0,

  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluido')),
  started_at timestamptz,
  completed_at timestamptz
);

alter table public.crm_process_steps enable row level security;

create index if not exists crm_process_steps_process_idx on public.crm_process_steps (process_id, position);

drop trigger if exists set_crm_process_steps_updated_at on public.crm_process_steps;
create trigger set_crm_process_steps_updated_at
  before update on public.crm_process_steps
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_process_steps" on public.crm_process_steps;
create policy "Equipe interna lê crm_process_steps"
  on public.crm_process_steps for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_process_steps" on public.crm_process_steps;
create policy "Equipe interna cria crm_process_steps"
  on public.crm_process_steps for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_process_steps" on public.crm_process_steps;
create policy "Equipe interna atualiza crm_process_steps"
  on public.crm_process_steps for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_process_steps" on public.crm_process_steps;
create policy "Equipe interna apaga crm_process_steps"
  on public.crm_process_steps for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Checklist — preso a uma etapa (step_id) OU direto ao processo (step_id
-- nulo). process_id é sempre preenchido (mesmo quando há step_id) para
-- permitir contar o checklist inteiro de um processo com uma única query,
-- sem join pela cadeia de etapas.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_process_checklist_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  process_id uuid not null references public.crm_processes (id) on delete cascade,
  step_id uuid references public.crm_process_steps (id) on delete cascade,
  label text not null,
  position integer not null default 0,

  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluido')),
  completed_at timestamptz,
  completed_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_process_checklist_items enable row level security;

create index if not exists crm_process_checklist_items_process_idx
  on public.crm_process_checklist_items (process_id, position);
create index if not exists crm_process_checklist_items_step_idx
  on public.crm_process_checklist_items (step_id, position);

drop trigger if exists set_crm_process_checklist_items_updated_at on public.crm_process_checklist_items;
create trigger set_crm_process_checklist_items_updated_at
  before update on public.crm_process_checklist_items
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_process_checklist_items" on public.crm_process_checklist_items;
create policy "Equipe interna lê crm_process_checklist_items"
  on public.crm_process_checklist_items for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_process_checklist_items" on public.crm_process_checklist_items;
create policy "Equipe interna cria crm_process_checklist_items"
  on public.crm_process_checklist_items for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_process_checklist_items" on public.crm_process_checklist_items;
create policy "Equipe interna atualiza crm_process_checklist_items"
  on public.crm_process_checklist_items for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_process_checklist_items" on public.crm_process_checklist_items;
create policy "Equipe interna apaga crm_process_checklist_items"
  on public.crm_process_checklist_items for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Aprovações — pode ser do processo inteiro (step_id nulo) ou de uma etapa
-- específica.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_process_approvals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  process_id uuid not null references public.crm_processes (id) on delete cascade,
  step_id uuid references public.crm_process_steps (id) on delete set null,

  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'reprovado')),
  notes text,
  decided_at timestamptz,

  requested_by uuid references public.profiles (id) on delete set null,
  approver_id uuid references public.profiles (id) on delete set null
);

alter table public.crm_process_approvals enable row level security;

create index if not exists crm_process_approvals_process_idx
  on public.crm_process_approvals (process_id, created_at desc);

drop policy if exists "Equipe interna lê crm_process_approvals" on public.crm_process_approvals;
create policy "Equipe interna lê crm_process_approvals"
  on public.crm_process_approvals for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_process_approvals" on public.crm_process_approvals;
create policy "Equipe interna cria crm_process_approvals"
  on public.crm_process_approvals for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_process_approvals" on public.crm_process_approvals;
create policy "Equipe interna atualiza crm_process_approvals"
  on public.crm_process_approvals for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Histórico — append-only (sem policy de update/delete, mesmo padrão de
-- crm_knowledge_versions da Fase 18). Toda alteração relevante gera uma
-- linha aqui a partir de services/processes/processesService.ts.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_process_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  process_id uuid not null references public.crm_processes (id) on delete cascade,
  event_type text not null check (event_type in (
    'processo_criado', 'processo_atualizado', 'status_alterado',
    'responsavel_alterado', 'etapa_iniciada', 'etapa_concluida',
    'checklist_item_concluido', 'checklist_item_reaberto',
    'documento_anexado', 'arquivo_anexado',
    'aprovacao_solicitada', 'aprovacao_decidida', 'processo_arquivado'
  )),
  description text not null,
  metadata jsonb not null default '{}'::jsonb,

  actor_id uuid references public.profiles (id) on delete set null
);

alter table public.crm_process_history enable row level security;

create index if not exists crm_process_history_process_idx
  on public.crm_process_history (process_id, created_at desc);

drop policy if exists "Equipe interna lê crm_process_history" on public.crm_process_history;
create policy "Equipe interna lê crm_process_history"
  on public.crm_process_history for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_process_history" on public.crm_process_history;
create policy "Equipe interna cria crm_process_history"
  on public.crm_process_history for insert
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Documentos relacionados / Base de conhecimento relacionada — junção m:n
-- para dentro da Base de Conhecimento já existente (Fase 18), nunca duplica
-- conteúdo.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_process_documents (
  process_id uuid not null references public.crm_processes (id) on delete cascade,
  document_id uuid not null references public.crm_knowledge_documents (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  primary key (process_id, document_id)
);

alter table public.crm_process_documents enable row level security;

create index if not exists crm_process_documents_document_idx on public.crm_process_documents (document_id);

drop policy if exists "Equipe interna lê crm_process_documents" on public.crm_process_documents;
create policy "Equipe interna lê crm_process_documents"
  on public.crm_process_documents for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_process_documents" on public.crm_process_documents;
create policy "Equipe interna cria crm_process_documents"
  on public.crm_process_documents for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_process_documents" on public.crm_process_documents;
create policy "Equipe interna apaga crm_process_documents"
  on public.crm_process_documents for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Arquivos próprios do processo — metadados aqui, binário no bucket Storage
-- privado crm-process-files (criado no fim deste arquivo).
-- ----------------------------------------------------------------------------
create table if not exists public.crm_process_files (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  process_id uuid not null references public.crm_processes (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_size integer,
  mime_type text,

  uploaded_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_process_files enable row level security;

create index if not exists crm_process_files_process_idx on public.crm_process_files (process_id);

drop policy if exists "Equipe interna lê crm_process_files" on public.crm_process_files;
create policy "Equipe interna lê crm_process_files"
  on public.crm_process_files for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_process_files" on public.crm_process_files;
create policy "Equipe interna cria crm_process_files"
  on public.crm_process_files for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_process_files" on public.crm_process_files;
create policy "Equipe interna apaga crm_process_files"
  on public.crm_process_files for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Bucket Storage privado — mesmo padrão de crm-knowledge-files (Fase 18):
-- sem policy de update, acesso só por is_internal_staff(), sempre via
-- Signed URL de curta duração.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('crm-process-files', 'crm-process-files', false)
on conflict (id) do nothing;

drop policy if exists "Equipe interna lê arquivos crm-process-files" on storage.objects;
create policy "Equipe interna lê arquivos crm-process-files"
  on storage.objects for select
  using (bucket_id = 'crm-process-files' and public.is_internal_staff());
drop policy if exists "Equipe interna envia arquivos crm-process-files" on storage.objects;
create policy "Equipe interna envia arquivos crm-process-files"
  on storage.objects for insert
  with check (bucket_id = 'crm-process-files' and public.is_internal_staff());
drop policy if exists "Equipe interna apaga arquivos crm-process-files" on storage.objects;
create policy "Equipe interna apaga arquivos crm-process-files"
  on storage.objects for delete
  using (bucket_id = 'crm-process-files' and public.is_internal_staff());
