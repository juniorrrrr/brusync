-- ============================================================================
-- Brusync OS — Fase 24: Playbooks Comerciais.
--
-- Aditivo apenas: módulo desacoplado para guiar operação comercial, sem
-- automações. Dados fictícios de demonstração ficam exclusivamente em
-- lib/demo/mockPlaybooks.ts; esta migration cria estrutura real e templates
-- operacionais padrão.
-- ============================================================================

create table if not exists public.crm_playbook_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  category text not null check (category in (
    'primeiro_contato', 'diagnostico', 'reuniao', 'proposta', 'negociacao',
    'follow_up', 'implantacao', 'pos_venda', 'renovacao'
  )),
  description text,
  objective text,
  steps_blueprint jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,

  created_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

alter table public.crm_playbook_templates enable row level security;

create index if not exists crm_playbook_templates_category_idx
  on public.crm_playbook_templates (category);

drop trigger if exists set_crm_playbook_templates_updated_at on public.crm_playbook_templates;
create trigger set_crm_playbook_templates_updated_at
  before update on public.crm_playbook_templates
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_playbook_templates" on public.crm_playbook_templates;
create policy "Equipe interna lê crm_playbook_templates"
  on public.crm_playbook_templates for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_playbook_templates" on public.crm_playbook_templates;
create policy "Equipe interna cria crm_playbook_templates"
  on public.crm_playbook_templates for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_playbook_templates" on public.crm_playbook_templates;
create policy "Equipe interna atualiza crm_playbook_templates"
  on public.crm_playbook_templates for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_playbook_templates" on public.crm_playbook_templates;
create policy "Equipe interna apaga crm_playbook_templates"
  on public.crm_playbook_templates for delete
  using (public.is_internal_staff() and not is_default);

grant select, insert, update, delete on public.crm_playbook_templates to authenticated;

create table if not exists public.crm_playbooks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  description text,
  category text not null check (category in (
    'primeiro_contato', 'diagnostico', 'reuniao', 'proposta', 'negociacao',
    'follow_up', 'implantacao', 'pos_venda', 'renovacao'
  )),
  objective text,
  pipeline text,
  pipeline_stage_id text,
  pipeline_stage_name text,
  owner_id uuid references public.profiles (id) on delete set null,
  status text not null default 'rascunho' check (status in ('rascunho', 'ativo', 'em_revisao', 'arquivado')),
  version integer not null default 1 check (version > 0),
  execution_count integer not null default 0 check (execution_count >= 0),
  template_id uuid references public.crm_playbook_templates (id) on delete set null,

  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

alter table public.crm_playbooks enable row level security;

create index if not exists crm_playbooks_category_idx on public.crm_playbooks (category);
create index if not exists crm_playbooks_status_idx on public.crm_playbooks (status);
create index if not exists crm_playbooks_owner_idx on public.crm_playbooks (owner_id);
create index if not exists crm_playbooks_pipeline_stage_idx on public.crm_playbooks (pipeline_stage_id);
create index if not exists crm_playbooks_updated_idx on public.crm_playbooks (updated_at desc);

drop trigger if exists set_crm_playbooks_updated_at on public.crm_playbooks;
create trigger set_crm_playbooks_updated_at
  before update on public.crm_playbooks
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_playbooks" on public.crm_playbooks;
create policy "Equipe interna lê crm_playbooks"
  on public.crm_playbooks for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_playbooks" on public.crm_playbooks;
create policy "Equipe interna cria crm_playbooks"
  on public.crm_playbooks for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_playbooks" on public.crm_playbooks;
create policy "Equipe interna atualiza crm_playbooks"
  on public.crm_playbooks for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_playbooks" on public.crm_playbooks;
create policy "Equipe interna apaga crm_playbooks"
  on public.crm_playbooks for delete
  using (public.is_internal_staff());

grant select, insert, update, delete on public.crm_playbooks to authenticated;

create table if not exists public.crm_playbook_steps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  playbook_id uuid not null references public.crm_playbooks (id) on delete cascade,
  title text not null,
  description text,
  objective text,
  checklist text[] not null default '{}',
  estimated_minutes integer,
  notes text,
  links jsonb not null default '[]'::jsonb,
  files jsonb not null default '[]'::jsonb,
  scripts text[] not null default '{}',
  best_practices text[] not null default '{}',
  common_mistakes text[] not null default '{}',
  approval_criteria text[] not null default '{}',
  rejection_criteria text[] not null default '{}',
  suggested_actions text[] not null default '{}' check (suggested_actions <@ array['ligacao', 'reuniao', 'follow_up', 'tarefa']),
  communication_channels text[] not null default '{}' check (communication_channels <@ array['whatsapp', 'email', 'conversa']),
  position integer not null default 0,
  status text not null default 'pendente' check (status in ('pendente', 'concluido'))
);

alter table public.crm_playbook_steps enable row level security;

create index if not exists crm_playbook_steps_playbook_idx
  on public.crm_playbook_steps (playbook_id, position);

drop trigger if exists set_crm_playbook_steps_updated_at on public.crm_playbook_steps;
create trigger set_crm_playbook_steps_updated_at
  before update on public.crm_playbook_steps
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_playbook_steps" on public.crm_playbook_steps;
create policy "Equipe interna lê crm_playbook_steps"
  on public.crm_playbook_steps for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_playbook_steps" on public.crm_playbook_steps;
create policy "Equipe interna cria crm_playbook_steps"
  on public.crm_playbook_steps for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_playbook_steps" on public.crm_playbook_steps;
create policy "Equipe interna atualiza crm_playbook_steps"
  on public.crm_playbook_steps for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_playbook_steps" on public.crm_playbook_steps;
create policy "Equipe interna apaga crm_playbook_steps"
  on public.crm_playbook_steps for delete
  using (public.is_internal_staff());

grant select, insert, update, delete on public.crm_playbook_steps to authenticated;

create table if not exists public.crm_playbook_assignments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  assigned_at timestamptz not null default now(),

  playbook_id uuid not null references public.crm_playbooks (id) on delete cascade,
  crm_lead_id uuid references public.crm_leads (id) on delete cascade,
  owner_id uuid references public.profiles (id) on delete set null,
  current_step_id uuid references public.crm_playbook_steps (id) on delete set null,
  status text not null default 'ativo' check (status in ('ativo', 'concluido', 'cancelado')),
  assigned_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_playbook_assignments enable row level security;

create index if not exists crm_playbook_assignments_playbook_idx
  on public.crm_playbook_assignments (playbook_id);
create index if not exists crm_playbook_assignments_lead_idx
  on public.crm_playbook_assignments (crm_lead_id);

drop policy if exists "Equipe interna lê crm_playbook_assignments" on public.crm_playbook_assignments;
create policy "Equipe interna lê crm_playbook_assignments"
  on public.crm_playbook_assignments for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_playbook_assignments" on public.crm_playbook_assignments;
create policy "Equipe interna cria crm_playbook_assignments"
  on public.crm_playbook_assignments for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_playbook_assignments" on public.crm_playbook_assignments;
create policy "Equipe interna atualiza crm_playbook_assignments"
  on public.crm_playbook_assignments for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_playbook_assignments" on public.crm_playbook_assignments;
create policy "Equipe interna apaga crm_playbook_assignments"
  on public.crm_playbook_assignments for delete
  using (public.is_internal_staff());

grant select, insert, update, delete on public.crm_playbook_assignments to authenticated;

create table if not exists public.crm_playbook_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  playbook_id uuid references public.crm_playbooks (id) on delete cascade,
  assignment_id uuid references public.crm_playbook_assignments (id) on delete cascade,
  event_type text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  actor_id uuid references public.profiles (id) on delete set null
);

alter table public.crm_playbook_history enable row level security;

create index if not exists crm_playbook_history_playbook_idx
  on public.crm_playbook_history (playbook_id, created_at desc);
create index if not exists crm_playbook_history_assignment_idx
  on public.crm_playbook_history (assignment_id, created_at desc);

drop policy if exists "Equipe interna lê crm_playbook_history" on public.crm_playbook_history;
create policy "Equipe interna lê crm_playbook_history"
  on public.crm_playbook_history for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_playbook_history" on public.crm_playbook_history;
create policy "Equipe interna cria crm_playbook_history"
  on public.crm_playbook_history for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_playbook_history" on public.crm_playbook_history;
create policy "Equipe interna atualiza crm_playbook_history"
  on public.crm_playbook_history for update
  using (false);
drop policy if exists "Equipe interna apaga crm_playbook_history" on public.crm_playbook_history;
create policy "Equipe interna apaga crm_playbook_history"
  on public.crm_playbook_history for delete
  using (false);

grant select, insert on public.crm_playbook_history to authenticated;

create table if not exists public.crm_playbook_step_documents (
  playbook_step_id uuid not null references public.crm_playbook_steps (id) on delete cascade,
  document_id uuid not null references public.crm_knowledge_documents (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  primary key (playbook_step_id, document_id)
);

alter table public.crm_playbook_step_documents enable row level security;

drop policy if exists "Equipe interna lê crm_playbook_step_documents" on public.crm_playbook_step_documents;
create policy "Equipe interna lê crm_playbook_step_documents"
  on public.crm_playbook_step_documents for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_playbook_step_documents" on public.crm_playbook_step_documents;
create policy "Equipe interna cria crm_playbook_step_documents"
  on public.crm_playbook_step_documents for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_playbook_step_documents" on public.crm_playbook_step_documents;
create policy "Equipe interna apaga crm_playbook_step_documents"
  on public.crm_playbook_step_documents for delete
  using (public.is_internal_staff());

grant select, insert, delete on public.crm_playbook_step_documents to authenticated;

insert into public.crm_playbook_templates (name, category, description, objective, is_default, steps_blueprint) values
  ('Primeiro contato', 'primeiro_contato', 'Modelo para abertura de conversa com lead.', 'Gerar conexão inicial e próximo passo claro.', true, '[]'::jsonb),
  ('Diagnóstico', 'diagnostico', 'Modelo para descoberta comercial.', 'Entender dores, impacto e critérios de decisão.', true, '[]'::jsonb),
  ('Reunião', 'reuniao', 'Modelo para reuniões comerciais.', 'Conduzir conversa com agenda e encaminhamento.', true, '[]'::jsonb),
  ('Proposta', 'proposta', 'Modelo para envio e apresentação de proposta.', 'Conectar escopo e valor ao diagnóstico.', true, '[]'::jsonb),
  ('Negociação', 'negociacao', 'Modelo para tratamento de objeções.', 'Preservar valor e remover riscos de decisão.', true, '[]'::jsonb),
  ('Follow-up', 'follow_up', 'Modelo para retomadas comerciais.', 'Manter cadência útil sem criar ruído.', true, '[]'::jsonb),
  ('Implantação', 'implantacao', 'Modelo para passagem comercial-operacional.', 'Garantir handoff completo sem perda de contexto.', true, '[]'::jsonb),
  ('Pós-venda', 'pos_venda', 'Modelo para acompanhamento pós-venda.', 'Validar adoção, satisfação e oportunidades.', true, '[]'::jsonb),
  ('Renovação', 'renovacao', 'Modelo para renovação consultiva.', 'Preparar renovação com evidência de resultado.', true, '[]'::jsonb)
on conflict do nothing;
