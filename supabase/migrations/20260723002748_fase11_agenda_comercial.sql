-- ============================================================================
-- Brusync OS — Fase 11: Agenda Comercial.
--
-- Aditivo apenas — nenhuma tabela existente é alterada. Agenda focada na
-- rotina comercial (ligações, reuniões, follow-ups, propostas, implantação),
-- não um calendário genérico: todo evento pode se ligar a um Lead e alimenta
-- a Timeline dele automaticamente (reaproveitando public.crm_lead_activities,
-- já existente — nenhuma coluna nova lá).
--
-- Duas tabelas, um conceito cada:
--   crm_agenda_events → o evento comercial agendado em si (o que popula
--                       "Agenda do dia", "Reuniões", "Follow-ups", etc.).
--   crm_reminders     → lembretes leves, opcionalmente ligados a um evento
--                       ou diretamente a um lead, sem toda a estrutura de
--                       um evento completo.
-- ============================================================================

create table if not exists public.crm_agenda_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  crm_lead_id uuid references public.crm_leads (id) on delete cascade,

  title text not null,
  description text,
  event_type text not null check (event_type in (
    'ligacao', 'reuniao', 'follow_up', 'proposta', 'implantacao', 'outro'
  )),

  scheduled_at timestamptz not null,
  duration_minutes integer,

  status text not null default 'agendado' check (status in ('agendado', 'concluido', 'cancelado')),
  completed_at timestamptz,

  owner_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_agenda_events enable row level security;

create index if not exists crm_agenda_events_lead_idx on public.crm_agenda_events (crm_lead_id);
create index if not exists crm_agenda_events_scheduled_idx on public.crm_agenda_events (scheduled_at);
create index if not exists crm_agenda_events_status_idx on public.crm_agenda_events (status);
create index if not exists crm_agenda_events_owner_idx on public.crm_agenda_events (owner_id);
create index if not exists crm_agenda_events_type_idx on public.crm_agenda_events (event_type);

drop trigger if exists set_crm_agenda_events_updated_at on public.crm_agenda_events;
create trigger set_crm_agenda_events_updated_at
  before update on public.crm_agenda_events
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_agenda_events" on public.crm_agenda_events;
create policy "Equipe interna lê crm_agenda_events"
  on public.crm_agenda_events for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_agenda_events" on public.crm_agenda_events;
create policy "Equipe interna cria crm_agenda_events"
  on public.crm_agenda_events for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_agenda_events" on public.crm_agenda_events;
create policy "Equipe interna atualiza crm_agenda_events"
  on public.crm_agenda_events for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_agenda_events" on public.crm_agenda_events;
create policy "Equipe interna apaga crm_agenda_events"
  on public.crm_agenda_events for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Lembretes leves — podem apontar para um evento (lembrar antes de uma
-- reunião, por exemplo) ou existir sozinhos, ligados apenas a um lead.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_reminders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  crm_lead_id uuid references public.crm_leads (id) on delete cascade,
  agenda_event_id uuid references public.crm_agenda_events (id) on delete cascade,

  message text not null,
  remind_at timestamptz not null,
  status text not null default 'pendente' check (status in ('pendente', 'concluido', 'dispensado')),

  owner_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_reminders enable row level security;

create index if not exists crm_reminders_lead_idx on public.crm_reminders (crm_lead_id);
create index if not exists crm_reminders_event_idx on public.crm_reminders (agenda_event_id);
create index if not exists crm_reminders_remind_at_idx on public.crm_reminders (remind_at);
create index if not exists crm_reminders_status_idx on public.crm_reminders (status);

drop trigger if exists set_crm_reminders_updated_at on public.crm_reminders;
create trigger set_crm_reminders_updated_at
  before update on public.crm_reminders
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_reminders" on public.crm_reminders;
create policy "Equipe interna lê crm_reminders"
  on public.crm_reminders for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_reminders" on public.crm_reminders;
create policy "Equipe interna cria crm_reminders"
  on public.crm_reminders for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_reminders" on public.crm_reminders;
create policy "Equipe interna atualiza crm_reminders"
  on public.crm_reminders for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_reminders" on public.crm_reminders;
create policy "Equipe interna apaga crm_reminders"
  on public.crm_reminders for delete
  using (public.is_internal_staff());
