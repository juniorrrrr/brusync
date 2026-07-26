-- ============================================================================
-- Brusync OS — Fase 27: Analytics (Business Intelligence).
--
-- Aditivo apenas. Analytics é uma camada VISUAL — um construtor de
-- dashboards que só guarda CONFIGURAÇÃO (quais widgets, quais filtros, qual
-- layout). Nenhum valor calculado (receita, leads, CAC, etc.) é persistido
-- aqui; todo número é resolvido ao vivo por
-- services/analytics/analyticsMetricsService.ts, que só chama as camadas de
-- aplicação já existentes de CRM, Marketing, Financeiro, Projetos, Agenda,
-- Comunicação, Equipe (Fase 25), Conversões, Integrações, Performance
-- (Fase 23), Central de Inteligência (Fase 19) e IA (Fase 26) — mesmo
-- princípio "só persiste o que não é derivável" das Fases 22/23/25/26.
-- ============================================================================

create table if not exists public.analytics_dashboards (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  description text,
  status text not null default 'ativo' check (status in ('ativo', 'arquivado')),
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.analytics_dashboards enable row level security;

create index if not exists analytics_dashboards_status_idx on public.analytics_dashboards (status);
create index if not exists analytics_dashboards_created_by_idx
  on public.analytics_dashboards (created_by, updated_at desc);

drop trigger if exists set_analytics_dashboards_updated_at on public.analytics_dashboards;
create trigger set_analytics_dashboards_updated_at
  before update on public.analytics_dashboards
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê analytics_dashboards" on public.analytics_dashboards;
create policy "Equipe interna lê analytics_dashboards"
  on public.analytics_dashboards for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia analytics_dashboards" on public.analytics_dashboards;
create policy "Equipe interna gerencia analytics_dashboards"
  on public.analytics_dashboards for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Widgets — um por card no dashboard. `metric`/`data_source` só apontam para
-- o que services/analytics/analyticsMetricsService.ts sabe resolver
-- (domain/analytics/metricsCatalog.ts); `config` guarda opções leves de
-- exibição (agrupamento, top N, comparativo ligado/desligado), nunca dado.
-- ----------------------------------------------------------------------------
create table if not exists public.analytics_widgets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  dashboard_id uuid not null references public.analytics_dashboards (id) on delete cascade,
  type text not null check (type in (
    'kpi', 'linha', 'barras', 'pizza', 'tabela', 'funil', 'area', 'radar',
    'heatmap', 'ranking', 'indicador', 'cards'
  )),
  data_source text not null check (data_source in (
    'crm', 'marketing', 'financeiro', 'projetos', 'agenda', 'comunicacao',
    'equipe', 'conversoes', 'integracoes', 'performance', 'inteligencia', 'ia'
  )),
  metric text not null,
  title text not null,
  size text not null default 'medio' check (size in ('pequeno', 'medio', 'grande', 'largo')),
  position integer not null default 0,
  config jsonb not null default '{}'::jsonb
);

alter table public.analytics_widgets enable row level security;

create index if not exists analytics_widgets_dashboard_idx
  on public.analytics_widgets (dashboard_id, position);

drop trigger if exists set_analytics_widgets_updated_at on public.analytics_widgets;
create trigger set_analytics_widgets_updated_at
  before update on public.analytics_widgets
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê analytics_widgets" on public.analytics_widgets;
create policy "Equipe interna lê analytics_widgets"
  on public.analytics_widgets for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia analytics_widgets" on public.analytics_widgets;
create policy "Equipe interna gerencia analytics_widgets"
  on public.analytics_widgets for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Filtros globais salvos por dashboard — um row por chave de filtro
-- (período/responsável/cliente/lead/projeto/origem/campanha/canal/cidade/
-- status/pipeline/equipe), para o dashboard reabrir exatamente como foi
-- deixado.
-- ----------------------------------------------------------------------------
create table if not exists public.analytics_filters (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  dashboard_id uuid not null references public.analytics_dashboards (id) on delete cascade,
  key text not null check (key in (
    'periodo', 'responsavel', 'cliente', 'lead', 'projeto', 'origem', 'campanha',
    'canal', 'cidade', 'status', 'pipeline', 'equipe'
  )),
  value text,

  unique (dashboard_id, key)
);

alter table public.analytics_filters enable row level security;

create index if not exists analytics_filters_dashboard_idx on public.analytics_filters (dashboard_id);

drop policy if exists "Equipe interna lê analytics_filters" on public.analytics_filters;
create policy "Equipe interna lê analytics_filters"
  on public.analytics_filters for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia analytics_filters" on public.analytics_filters;
create policy "Equipe interna gerencia analytics_filters"
  on public.analytics_filters for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Compartilhamento — link de leitura interno (ainda atrás do login; "público
-- interno" = qualquer colaborador autenticado com o link, não a internet).
-- ----------------------------------------------------------------------------
create table if not exists public.analytics_shares (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  dashboard_id uuid not null references public.analytics_dashboards (id) on delete cascade,
  share_token uuid not null default gen_random_uuid() unique,
  created_by uuid references public.profiles (id) on delete set null,
  revoked_at timestamptz
);

alter table public.analytics_shares enable row level security;

create index if not exists analytics_shares_dashboard_idx on public.analytics_shares (dashboard_id);
create index if not exists analytics_shares_token_idx on public.analytics_shares (share_token);

drop policy if exists "Equipe interna lê analytics_shares" on public.analytics_shares;
create policy "Equipe interna lê analytics_shares"
  on public.analytics_shares for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia analytics_shares" on public.analytics_shares;
create policy "Equipe interna gerencia analytics_shares"
  on public.analytics_shares for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Favoritos — preferência pessoal de UI (mesmo padrão "Usuário" de
-- operations_favorites, Fase 20 — diferente do padrão "Equipe interna"
-- acima, porque favorito é individual, não dado de negócio compartilhado).
-- ----------------------------------------------------------------------------
create table if not exists public.analytics_favorites (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  dashboard_id uuid not null references public.analytics_dashboards (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,

  unique (dashboard_id, user_id)
);

alter table public.analytics_favorites enable row level security;

create index if not exists analytics_favorites_user_idx on public.analytics_favorites (user_id);

drop policy if exists "Usuário lê os próprios favoritos de analytics" on public.analytics_favorites;
create policy "Usuário lê os próprios favoritos de analytics"
  on public.analytics_favorites for select
  using (public.is_internal_staff() and user_id = auth.uid());
drop policy if exists "Usuário cria os próprios favoritos de analytics" on public.analytics_favorites;
create policy "Usuário cria os próprios favoritos de analytics"
  on public.analytics_favorites for insert
  with check (public.is_internal_staff() and user_id = auth.uid());
drop policy if exists "Usuário apaga os próprios favoritos de analytics" on public.analytics_favorites;
create policy "Usuário apaga os próprios favoritos de analytics"
  on public.analytics_favorites for delete
  using (public.is_internal_staff() and user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Snapshots — guarda só o ESTADO do dashboard (widgets + filtros) num dado
-- momento, nunca os valores calculados; "comparar snapshots antigos" reroda
-- os widgets de cada snapshot com os dados ATUAIS (mesma limitação de
-- "estado atual" já aceita pela Fase 23 para métricas fora do escopo
-- empresa — não há série histórica de métricas para reconstruir).
-- ----------------------------------------------------------------------------
create table if not exists public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  dashboard_id uuid not null references public.analytics_dashboards (id) on delete cascade,
  label text not null,
  state jsonb not null,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.analytics_snapshots enable row level security;

create index if not exists analytics_snapshots_dashboard_idx
  on public.analytics_snapshots (dashboard_id, created_at desc);

drop policy if exists "Equipe interna lê analytics_snapshots" on public.analytics_snapshots;
create policy "Equipe interna lê analytics_snapshots"
  on public.analytics_snapshots for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia analytics_snapshots" on public.analytics_snapshots;
create policy "Equipe interna gerencia analytics_snapshots"
  on public.analytics_snapshots for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
