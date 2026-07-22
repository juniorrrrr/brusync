-- ============================================================================
-- Brusync OS — Fase 8: Conversions Hub.
--
-- Aditivo apenas — nenhuma tabela existente é alterada. Transforma os
-- eventos já publicados pelo Motor de Conversões (Fase 7, via
-- services/eventBus → public.integration_events) em "eventos de conversão"
-- normalizados e prontos para envio a plataformas de anúncio — sem nunca
-- chamar nenhuma API externa nesta fase.
--
-- Três tabelas, um conceito cada:
--   conversion_events            → o evento preparado (Lead, Qualified Lead,
--                                   Meeting Scheduled, Proposal Sent,
--                                   Purchase, Lost Lead, Client Activated).
--   conversion_deliveries        → a fila de envio: uma linha por par
--                                   (evento, destino), com status/tentativas/
--                                   último erro.
--   conversion_delivery_attempts → histórico append-only de cada tentativa
--                                   de envio de uma delivery.
-- ============================================================================

create table if not exists public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  conversion_type text not null check (conversion_type in (
    'lead', 'qualified_lead', 'meeting_scheduled', 'proposal_sent',
    'purchase', 'lost_lead', 'client_activated'
  )),

  -- De onde, dentro do Brusync, este evento nasceu (ex.: "Cadastro de Lead",
  -- "Pipeline", "Jornada Comercial") — não confundir com utm_source, que é a
  -- origem de marketing do lead em si.
  origin text not null default 'crm',

  crm_lead_id uuid references public.crm_leads (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,

  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  campaign_key text,
  gclid text,
  fbclid text,
  msclkid text,
  ttclid text,

  occurred_at timestamptz not null default now(),
  actor_id uuid references public.profiles (id) on delete set null,

  value numeric(14, 2),
  currency text not null default 'BRL',

  -- "Pronto para envio" — falso apenas quando faltam dados mínimos (por
  -- exemplo, o lead de origem foi excluído depois deste evento existir).
  ready boolean not null default true,

  -- Rastreabilidade: qual linha de public.integration_events (Fase 6) deu
  -- origem a este evento de conversão.
  integration_event_id uuid references public.integration_events (id) on delete set null
);

alter table public.conversion_events enable row level security;

create index if not exists conversion_events_lead_idx on public.conversion_events (crm_lead_id);
create index if not exists conversion_events_type_idx on public.conversion_events (conversion_type);
create index if not exists conversion_events_created_idx on public.conversion_events (created_at desc);

drop policy if exists "Equipe interna lê conversion_events" on public.conversion_events;
create policy "Equipe interna lê conversion_events"
  on public.conversion_events for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria conversion_events" on public.conversion_events;
create policy "Equipe interna cria conversion_events"
  on public.conversion_events for insert
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Fila de envio: uma linha por (evento, destino). Ao contrário de
-- conversion_events, esta tabela é mutável de propósito — status/attempts/
-- last_error/sent_at mudam conforme um futuro dispatcher processa a fila.
-- ----------------------------------------------------------------------------
create table if not exists public.conversion_deliveries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  conversion_event_id uuid not null references public.conversion_events (id) on delete cascade,
  destination text not null check (destination in (
    'meta_ads', 'google_ads', 'ga4', 'tiktok_ads', 'linkedin_ads', 'webhook'
  )),

  status text not null default 'pendente' check (status in ('pendente', 'enviado', 'falhou')),
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz
);

alter table public.conversion_deliveries enable row level security;

create index if not exists conversion_deliveries_event_idx on public.conversion_deliveries (conversion_event_id);
create index if not exists conversion_deliveries_destination_idx on public.conversion_deliveries (destination);
create index if not exists conversion_deliveries_status_idx on public.conversion_deliveries (status);

drop trigger if exists set_conversion_deliveries_updated_at on public.conversion_deliveries;
create trigger set_conversion_deliveries_updated_at
  before update on public.conversion_deliveries
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê conversion_deliveries" on public.conversion_deliveries;
create policy "Equipe interna lê conversion_deliveries"
  on public.conversion_deliveries for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria conversion_deliveries" on public.conversion_deliveries;
create policy "Equipe interna cria conversion_deliveries"
  on public.conversion_deliveries for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza conversion_deliveries" on public.conversion_deliveries;
create policy "Equipe interna atualiza conversion_deliveries"
  on public.conversion_deliveries for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Histórico append-only de tentativas de envio — nunca update, nunca delete,
-- mesmo padrão de imutabilidade da Fase 7 (sem policy de update/delete).
-- ----------------------------------------------------------------------------
create table if not exists public.conversion_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  conversion_delivery_id uuid not null references public.conversion_deliveries (id) on delete cascade,
  status text not null check (status in ('sucesso', 'erro')),
  message text,
  duration_ms integer
);

alter table public.conversion_delivery_attempts enable row level security;

create index if not exists conversion_delivery_attempts_delivery_idx
  on public.conversion_delivery_attempts (conversion_delivery_id, created_at desc);

drop policy if exists "Equipe interna lê conversion_delivery_attempts" on public.conversion_delivery_attempts;
create policy "Equipe interna lê conversion_delivery_attempts"
  on public.conversion_delivery_attempts for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria conversion_delivery_attempts" on public.conversion_delivery_attempts;
create policy "Equipe interna cria conversion_delivery_attempts"
  on public.conversion_delivery_attempts for insert
  with check (public.is_internal_staff());
