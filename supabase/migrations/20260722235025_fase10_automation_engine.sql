-- ============================================================================
-- Brusync OS — Fase 10: Motor de Automações (Workflow Engine).
--
-- Aditivo apenas — nenhuma tabela existente é alterada. Módulo totalmente
-- desacoplado do restante do CRM: nenhuma integração externa é feita aqui,
-- apenas o motor SE → CONDIÇÃO → AÇÃO que futuras integrações vão consumir.
--
-- Quatro tabelas, um conceito cada:
--   automation_workflows  → a automação em si (nome, status, prioridade,
--                           condição, ação, descrição) — mutável.
--   automation_triggers   → o gatilho de uma automação (um por workflow
--                           nesta fase; separado para permitir múltiplos
--                           gatilhos por workflow no futuro sem redesenho).
--   automation_executions → histórico append-only de cada disparo avaliado.
--   automation_logs       → log técnico append-only, granular, por execução.
-- ============================================================================

create table if not exists public.automation_workflows (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  description text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta')),

  condition_type text not null default 'sempre' check (condition_type in (
    'sempre', 'origem_igual', 'score_maior_igual', 'dias_parado_maior_igual', 'estagio_igual'
  )),
  condition_config jsonb not null default '{}'::jsonb,

  action_type text not null check (action_type in (
    'mover_pipeline', 'criar_tarefa', 'criar_alerta', 'solicitar_motivo_perda', 'criar_onboarding'
  )),
  action_config jsonb not null default '{}'::jsonb,

  created_by uuid references public.profiles (id) on delete set null
);

alter table public.automation_workflows enable row level security;

create index if not exists automation_workflows_status_idx on public.automation_workflows (status);

drop trigger if exists set_automation_workflows_updated_at on public.automation_workflows;
create trigger set_automation_workflows_updated_at
  before update on public.automation_workflows
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê automation_workflows" on public.automation_workflows;
create policy "Equipe interna lê automation_workflows"
  on public.automation_workflows for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria automation_workflows" on public.automation_workflows;
create policy "Equipe interna cria automation_workflows"
  on public.automation_workflows for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza automation_workflows" on public.automation_workflows;
create policy "Equipe interna atualiza automation_workflows"
  on public.automation_workflows for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga automation_workflows" on public.automation_workflows;
create policy "Equipe interna apaga automation_workflows"
  on public.automation_workflows for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Gatilho de cada automação. Um por workflow nesta fase (índice único),
-- separado em tabela própria para futuras fases poderem associar mais de um
-- gatilho a uma automação sem precisar redesenhar o schema.
-- ----------------------------------------------------------------------------
create table if not exists public.automation_triggers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  workflow_id uuid not null references public.automation_workflows (id) on delete cascade,
  trigger_type text not null check (trigger_type in (
    'lead_created', 'lead_qualified', 'lead_stalled', 'lead_lost', 'client_created'
  )),
  trigger_config jsonb not null default '{}'::jsonb
);

alter table public.automation_triggers enable row level security;

create unique index if not exists automation_triggers_workflow_idx on public.automation_triggers (workflow_id);
create index if not exists automation_triggers_type_idx on public.automation_triggers (trigger_type);

drop trigger if exists set_automation_triggers_updated_at on public.automation_triggers;
create trigger set_automation_triggers_updated_at
  before update on public.automation_triggers
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê automation_triggers" on public.automation_triggers;
create policy "Equipe interna lê automation_triggers"
  on public.automation_triggers for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria automation_triggers" on public.automation_triggers;
create policy "Equipe interna cria automation_triggers"
  on public.automation_triggers for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza automation_triggers" on public.automation_triggers;
create policy "Equipe interna atualiza automation_triggers"
  on public.automation_triggers for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga automation_triggers" on public.automation_triggers;
create policy "Equipe interna apaga automation_triggers"
  on public.automation_triggers for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Histórico de execuções (timeline). Append-only: nenhuma policy de
-- update/delete — o mesmo padrão de conversion_events (Fase 8).
-- ----------------------------------------------------------------------------
create table if not exists public.automation_executions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  workflow_id uuid references public.automation_workflows (id) on delete set null,
  crm_lead_id uuid references public.crm_leads (id) on delete set null,

  trigger_type text not null,
  status text not null check (status in ('sucesso', 'condicao_nao_atendida', 'erro')),
  result_message text,
  duration_ms integer not null default 0,
  event_snapshot jsonb,

  executed_at timestamptz not null default now()
);

alter table public.automation_executions enable row level security;

create index if not exists automation_executions_workflow_idx on public.automation_executions (workflow_id);
create index if not exists automation_executions_lead_idx on public.automation_executions (crm_lead_id);
create index if not exists automation_executions_executed_idx on public.automation_executions (executed_at desc);
create index if not exists automation_executions_status_idx on public.automation_executions (status);

drop policy if exists "Equipe interna lê automation_executions" on public.automation_executions;
create policy "Equipe interna lê automation_executions"
  on public.automation_executions for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria automation_executions" on public.automation_executions;
create policy "Equipe interna cria automation_executions"
  on public.automation_executions for insert
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Log técnico granular, append-only, ligado a uma execução.
-- ----------------------------------------------------------------------------
create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  workflow_id uuid references public.automation_workflows (id) on delete set null,
  execution_id uuid references public.automation_executions (id) on delete cascade,

  level text not null default 'info' check (level in ('info', 'aviso', 'erro')),
  message text not null,
  metadata jsonb
);

alter table public.automation_logs enable row level security;

create index if not exists automation_logs_workflow_idx on public.automation_logs (workflow_id);
create index if not exists automation_logs_execution_idx on public.automation_logs (execution_id);
create index if not exists automation_logs_created_idx on public.automation_logs (created_at desc);

drop policy if exists "Equipe interna lê automation_logs" on public.automation_logs;
create policy "Equipe interna lê automation_logs"
  on public.automation_logs for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria automation_logs" on public.automation_logs;
create policy "Equipe interna cria automation_logs"
  on public.automation_logs for insert
  with check (public.is_internal_staff());
