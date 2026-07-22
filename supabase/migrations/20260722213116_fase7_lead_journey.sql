-- ============================================================================
-- Brusync OS — Fase 7: Motor de Conversões (Jornada Comercial do Lead).
--
-- Aditivo apenas — nenhuma tabela existente é alterada. Adiciona o registro
-- estruturado e append-only da jornada comercial de cada lead (13 etapas,
-- da captação à ativação como cliente), com data/hora, usuário responsável,
-- origem da mudança, observação opcional e o score comercial daquele
-- momento. Complementar a public.crm_lead_activities (timeline genérica já
-- existente, que continua exatamente como está) e a public.crm_lead_stage_
-- history (histórico do Pipeline/Kanban, também inalterado) — a jornada é um
-- terceiro conceito, mais granular, que não substitui nenhum dos dois.
-- ============================================================================

create table if not exists public.crm_lead_journey_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  crm_lead_id uuid not null references public.crm_leads (id) on delete cascade,

  stage text not null check (stage in (
    'novo_lead', 'primeiro_contato', 'contato_realizado', 'lead_qualificado',
    'lead_desqualificado', 'reuniao_agendada', 'diagnostico', 'proposta_enviada',
    'negociacao', 'venda_ganha', 'venda_perdida', 'implantacao', 'cliente_ativo'
  )),

  -- "Data" e "Hora" do evento — normalmente = created_at, mas fica em campo
  -- próprio para permitir registrar um evento ocorrido no passado (ex.: uma
  -- reunião que já aconteceu e só foi lançada no sistema depois).
  occurred_at timestamptz not null default now(),

  actor_id uuid references public.profiles (id) on delete set null,
  origin text not null default 'manual' check (origin in ('manual', 'automatico', 'sistema')),
  note text,

  -- Score comercial no momento deste evento (ver domain/journey/stages.ts) —
  -- guardado aqui, e não recalculado depois, para que o histórico de score
  -- de um lead nunca mude retroativamente só porque a tabela de pontos foi
  -- ajustada no futuro.
  score integer not null check (score >= 0 and score <= 100)
);

alter table public.crm_lead_journey_events enable row level security;

create index if not exists crm_lead_journey_events_lead_idx
  on public.crm_lead_journey_events (crm_lead_id, occurred_at);
create index if not exists crm_lead_journey_events_stage_idx
  on public.crm_lead_journey_events (stage);

-- Somente leitura e inserção — nunca update, nunca delete. "Nada pode ser
-- perdido" e "nenhuma alteração pode sobrescrever outra" são garantidos aqui
-- no nível de permissão (RLS), não apenas por convenção no código da
-- aplicação: não existe policy de update/delete para nenhum papel.
drop policy if exists "Equipe interna lê crm_lead_journey_events" on public.crm_lead_journey_events;
create policy "Equipe interna lê crm_lead_journey_events"
  on public.crm_lead_journey_events for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_lead_journey_events" on public.crm_lead_journey_events;
create policy "Equipe interna cria crm_lead_journey_events"
  on public.crm_lead_journey_events for insert
  with check (public.is_internal_staff());
