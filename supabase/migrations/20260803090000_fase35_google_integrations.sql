-- ============================================================================
-- Brusync OS — Fase 35: Evolução da Central de Integrações (Google).
--
-- Google Ads, Google Analytics 4, Google Tag Manager e Google Search Console
-- passam de "em desenvolvimento" para conexões reais, cada uma sua própria
-- vida (conectar/desconectar/sincronizar independente), todas autenticando
-- contra o mesmo OAuth Client do Google Cloud (google_oauth_tokens.provider
-- distingue qual delas). Modelo consolidado: cada integração guarda a
-- entidade raiz (conta Ads / propriedade GA4 / container GTM / site GSC) +
-- métricas diárias agregadas cobrindo tudo pedido no briefing, sem uma
-- tabela por sub-entidade que nenhuma tela vai listar em detalhe.
--
-- Reaproveita integralmente a infraestrutura da Fase 34: nenhum provider
-- fala com o Supabase fora de sua própria pasta repositories/*, todos
-- passam por public.integrations/public.integration_logs (já existentes,
-- Fase 6) para o card/Drawer da Central de Integrações e a Central de
-- Operações refletirem status real — mesmo padrão que a Fase 34 ligou pela
-- primeira vez para o Meta Ads Manager.
--
-- public.integration_sync_jobs é nova aqui: fila/retry/backoff genérica que
-- os 4 providers desta fase usam e que qualquer integração futura (TikTok
-- Ads, LinkedIn Ads, Microsoft Ads, ...) reaproveita sem precisar de uma
-- tabela própria — exatamente o que a Fase 34 previu ("essa infraestrutura
-- deverá servir para todas as futuras integrações") mas não teve motivo
-- para criar ainda (o Meta Ads já tinha a sua, meta_sync_jobs, intocada).
--
-- Nenhuma tabela existente é alterada ou removida.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tokens OAuth — uma linha por renovação (nunca sobrescreve, mesmo padrão de
-- meta_tokens/Fase 29), mas compartilhada pelas 4 integrações via `provider`
-- em vez de 4 tabelas quase idênticas.
-- ----------------------------------------------------------------------------
create table if not exists public.google_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  provider text not null check (provider in ('google_ads', 'ga4', 'gtm', 'search_console')),
  google_account_email text,
  access_token_ciphertext text not null,
  access_token_iv text not null,
  refresh_token_ciphertext text,
  refresh_token_iv text,
  scopes text[] not null default '{}',
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.google_oauth_tokens enable row level security;

create index if not exists google_oauth_tokens_provider_idx
  on public.google_oauth_tokens (provider, created_at desc);

drop policy if exists "Equipe interna lê google_oauth_tokens" on public.google_oauth_tokens;
create policy "Equipe interna lê google_oauth_tokens"
  on public.google_oauth_tokens for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia google_oauth_tokens" on public.google_oauth_tokens;
create policy "Equipe interna gerencia google_oauth_tokens"
  on public.google_oauth_tokens for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Fila de sincronização genérica — retry/backoff exponencial
-- (domain/integrations/syncBackoff.ts, Fase 34) compartilhado pelos 4
-- providers desta fase e por toda integração futura.
-- ----------------------------------------------------------------------------
create table if not exists public.integration_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  integration_id uuid references public.integrations (id) on delete cascade,
  provider text not null,
  job_type text not null,
  status text not null default 'pendente' check (status in ('pendente', 'executando', 'concluido', 'falhou')),
  trigger_source text not null default 'automatico' check (trigger_source in ('manual', 'automatico', 'webhook')),
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  next_attempt_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  error text,
  stats jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.integration_sync_jobs enable row level security;

create index if not exists integration_sync_jobs_status_idx
  on public.integration_sync_jobs (status, next_attempt_at);
create index if not exists integration_sync_jobs_provider_idx
  on public.integration_sync_jobs (provider, created_at desc);

drop trigger if exists set_integration_sync_jobs_updated_at on public.integration_sync_jobs;
create trigger set_integration_sync_jobs_updated_at
  before update on public.integration_sync_jobs
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê integration_sync_jobs" on public.integration_sync_jobs;
create policy "Equipe interna lê integration_sync_jobs"
  on public.integration_sync_jobs for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia integration_sync_jobs" on public.integration_sync_jobs;
create policy "Equipe interna gerencia integration_sync_jobs"
  on public.integration_sync_jobs for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ============================================================================
-- Google Ads
-- ============================================================================

create table if not exists public.google_ads_accounts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  customer_id text not null unique,
  descriptive_name text,
  currency_code text,
  time_zone text,
  is_manager boolean not null default false,
  is_synced boolean not null default false,
  status text not null default 'desconectado' check (status in ('conectado', 'desconectado', 'erro')),
  last_sync_at timestamptz,
  error text,

  client_id uuid references public.clients (id) on delete set null,
  responsible_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.google_ads_accounts enable row level security;
create index if not exists google_ads_accounts_client_idx on public.google_ads_accounts (client_id);

drop trigger if exists set_google_ads_accounts_updated_at on public.google_ads_accounts;
create trigger set_google_ads_accounts_updated_at
  before update on public.google_ads_accounts
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê google_ads_accounts" on public.google_ads_accounts;
create policy "Equipe interna lê google_ads_accounts"
  on public.google_ads_accounts for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia google_ads_accounts" on public.google_ads_accounts;
create policy "Equipe interna gerencia google_ads_accounts"
  on public.google_ads_accounts for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

create table if not exists public.google_ads_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  account_id uuid not null references public.google_ads_accounts (id) on delete cascade,
  campaign_id text not null unique,
  name text not null,
  channel_type text,
  status text not null default 'PAUSED',
  budget_amount numeric(14, 2),

  crm_project_id uuid references public.crm_projects (id) on delete set null
);

alter table public.google_ads_campaigns enable row level security;
create index if not exists google_ads_campaigns_account_idx on public.google_ads_campaigns (account_id);

drop trigger if exists set_google_ads_campaigns_updated_at on public.google_ads_campaigns;
create trigger set_google_ads_campaigns_updated_at
  before update on public.google_ads_campaigns
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê google_ads_campaigns" on public.google_ads_campaigns;
create policy "Equipe interna lê google_ads_campaigns"
  on public.google_ads_campaigns for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia google_ads_campaigns" on public.google_ads_campaigns;
create policy "Equipe interna gerencia google_ads_campaigns"
  on public.google_ads_campaigns for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- Palavras-chave — nível de detalhe mantido (é o que o briefing pede para o
-- vínculo "Keyword" do CRM), mas sem grupo de anúncios próprio: o nome do
-- grupo vem como coluna (ad_group_name), não uma tabela à parte.
create table if not exists public.google_ads_keywords (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  campaign_id uuid not null references public.google_ads_campaigns (id) on delete cascade,
  keyword_id text not null unique,
  ad_group_name text,
  text text not null,
  match_type text,
  status text not null default 'PAUSED',
  clicks integer not null default 0,
  impressions integer not null default 0,
  cost numeric(14, 2) not null default 0
);

alter table public.google_ads_keywords enable row level security;
create index if not exists google_ads_keywords_campaign_idx on public.google_ads_keywords (campaign_id);

drop trigger if exists set_google_ads_keywords_updated_at on public.google_ads_keywords;
create trigger set_google_ads_keywords_updated_at
  before update on public.google_ads_keywords
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê google_ads_keywords" on public.google_ads_keywords;
create policy "Equipe interna lê google_ads_keywords"
  on public.google_ads_keywords for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia google_ads_keywords" on public.google_ads_keywords;
create policy "Equipe interna gerencia google_ads_keywords"
  on public.google_ads_keywords for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- Métricas diárias — cliques/CTR/CPM/CPA/ROAS/ROI/custo/conversões, no nível
-- de conta e opcionalmente de campanha (campaign_id nulo = total da conta).
create table if not exists public.google_ads_insights_daily (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  account_id uuid not null references public.google_ads_accounts (id) on delete cascade,
  campaign_id uuid references public.google_ads_campaigns (id) on delete cascade,
  date date not null,

  impressions integer not null default 0,
  clicks integer not null default 0,
  cost numeric(14, 2) not null default 0,
  conversions numeric(14, 2) not null default 0,
  conversions_value numeric(14, 2) not null default 0,
  ctr numeric(7, 4),
  cpm numeric(14, 2),
  cpa numeric(14, 2),
  roas numeric(10, 4),
  roi numeric(10, 4)
);

alter table public.google_ads_insights_daily enable row level security;
create unique index if not exists google_ads_insights_daily_unique_idx
  on public.google_ads_insights_daily (account_id, coalesce(campaign_id, '00000000-0000-0000-0000-000000000000'), date);
create index if not exists google_ads_insights_daily_account_idx
  on public.google_ads_insights_daily (account_id, date desc);

drop policy if exists "Equipe interna lê google_ads_insights_daily" on public.google_ads_insights_daily;
create policy "Equipe interna lê google_ads_insights_daily"
  on public.google_ads_insights_daily for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia google_ads_insights_daily" on public.google_ads_insights_daily;
create policy "Equipe interna gerencia google_ads_insights_daily"
  on public.google_ads_insights_daily for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ============================================================================
-- Google Analytics 4
-- ============================================================================

create table if not exists public.ga4_properties (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  property_id text not null unique,
  display_name text,
  time_zone text,
  currency_code text,
  is_synced boolean not null default false,
  status text not null default 'desconectado' check (status in ('conectado', 'desconectado', 'erro')),
  last_sync_at timestamptz,
  error text,

  client_id uuid references public.clients (id) on delete set null,
  responsible_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.ga4_properties enable row level security;
create index if not exists ga4_properties_client_idx on public.ga4_properties (client_id);

drop trigger if exists set_ga4_properties_updated_at on public.ga4_properties;
create trigger set_ga4_properties_updated_at
  before update on public.ga4_properties
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê ga4_properties" on public.ga4_properties;
create policy "Equipe interna lê ga4_properties"
  on public.ga4_properties for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia ga4_properties" on public.ga4_properties;
create policy "Equipe interna gerencia ga4_properties"
  on public.ga4_properties for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- Visão geral diária — sessões/usuários/receita/page views/engagement.
create table if not exists public.ga4_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  property_id uuid not null references public.ga4_properties (id) on delete cascade,
  date date not null,

  sessions integer not null default 0,
  users integer not null default 0,
  new_users integer not null default 0,
  engaged_sessions integer not null default 0,
  engagement_rate numeric(7, 4),
  page_views integer not null default 0,
  conversions numeric(14, 2) not null default 0,
  revenue numeric(14, 2) not null default 0
);

alter table public.ga4_metrics_daily enable row level security;
create unique index if not exists ga4_metrics_daily_unique_idx on public.ga4_metrics_daily (property_id, date);
create index if not exists ga4_metrics_daily_property_idx on public.ga4_metrics_daily (property_id, date desc);

drop policy if exists "Equipe interna lê ga4_metrics_daily" on public.ga4_metrics_daily;
create policy "Equipe interna lê ga4_metrics_daily"
  on public.ga4_metrics_daily for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia ga4_metrics_daily" on public.ga4_metrics_daily;
create policy "Equipe interna gerencia ga4_metrics_daily"
  on public.ga4_metrics_daily for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- Quebra por dimensão — um único formato para "Aquisição/Origens" (dimensão
-- 'channel') e "Dispositivos" (dimensão 'device'), em vez de duas tabelas
-- quase idênticas.
create table if not exists public.ga4_dimension_breakdown_daily (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  property_id uuid not null references public.ga4_properties (id) on delete cascade,
  date date not null,
  dimension_type text not null check (dimension_type in ('channel', 'device', 'source')),
  dimension_value text not null,

  sessions integer not null default 0,
  users integer not null default 0,
  conversions numeric(14, 2) not null default 0
);

alter table public.ga4_dimension_breakdown_daily enable row level security;
create index if not exists ga4_dimension_breakdown_daily_property_idx
  on public.ga4_dimension_breakdown_daily (property_id, dimension_type, date desc);

drop policy if exists "Equipe interna lê ga4_dimension_breakdown_daily" on public.ga4_dimension_breakdown_daily;
create policy "Equipe interna lê ga4_dimension_breakdown_daily"
  on public.ga4_dimension_breakdown_daily for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia ga4_dimension_breakdown_daily" on public.ga4_dimension_breakdown_daily;
create policy "Equipe interna gerencia ga4_dimension_breakdown_daily"
  on public.ga4_dimension_breakdown_daily for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ============================================================================
-- Google Tag Manager
-- ============================================================================

create table if not exists public.gtm_containers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  container_id text not null unique,
  account_id_external text,
  name text,
  public_id text,
  usage_context text[] not null default '{}',
  is_synced boolean not null default false,
  status text not null default 'desconectado' check (status in ('conectado', 'desconectado', 'erro')),
  last_sync_at timestamptz,
  error text,

  client_id uuid references public.clients (id) on delete set null,
  responsible_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.gtm_containers enable row level security;
create index if not exists gtm_containers_client_idx on public.gtm_containers (client_id);

drop trigger if exists set_gtm_containers_updated_at on public.gtm_containers;
create trigger set_gtm_containers_updated_at
  before update on public.gtm_containers
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê gtm_containers" on public.gtm_containers;
create policy "Equipe interna lê gtm_containers"
  on public.gtm_containers for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia gtm_containers" on public.gtm_containers;
create policy "Equipe interna gerencia gtm_containers"
  on public.gtm_containers for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- Workspaces/tags/triggers/variables — um único formato tipado por
-- entity_type em vez de 4 tabelas quase idênticas; "Status"/"Versões" ficam
-- nas colunas status/version.
create table if not exists public.gtm_entities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  container_id uuid not null references public.gtm_containers (id) on delete cascade,
  entity_type text not null check (entity_type in ('workspace', 'tag', 'trigger', 'variable')),
  external_id text not null,
  workspace_external_id text,
  name text,
  type text,
  status text,

  unique (container_id, entity_type, external_id)
);

alter table public.gtm_entities enable row level security;
create index if not exists gtm_entities_container_idx on public.gtm_entities (container_id, entity_type);

drop trigger if exists set_gtm_entities_updated_at on public.gtm_entities;
create trigger set_gtm_entities_updated_at
  before update on public.gtm_entities
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê gtm_entities" on public.gtm_entities;
create policy "Equipe interna lê gtm_entities"
  on public.gtm_entities for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia gtm_entities" on public.gtm_entities;
create policy "Equipe interna gerencia gtm_entities"
  on public.gtm_entities for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

create table if not exists public.gtm_versions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  container_id uuid not null references public.gtm_containers (id) on delete cascade,
  version_external_id text not null,
  name text,
  published_at timestamptz,

  unique (container_id, version_external_id)
);

alter table public.gtm_versions enable row level security;
create index if not exists gtm_versions_container_idx on public.gtm_versions (container_id, published_at desc);

drop policy if exists "Equipe interna lê gtm_versions" on public.gtm_versions;
create policy "Equipe interna lê gtm_versions"
  on public.gtm_versions for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia gtm_versions" on public.gtm_versions;
create policy "Equipe interna gerencia gtm_versions"
  on public.gtm_versions for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ============================================================================
-- Google Search Console
-- ============================================================================

create table if not exists public.search_console_sites (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  site_url text not null unique,
  permission_level text,
  is_synced boolean not null default false,
  status text not null default 'desconectado' check (status in ('conectado', 'desconectado', 'erro')),
  last_sync_at timestamptz,
  error text,

  indexed_count integer,
  excluded_count integer,
  coverage_checked_at timestamptz,

  client_id uuid references public.clients (id) on delete set null,
  responsible_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.search_console_sites enable row level security;
create index if not exists search_console_sites_client_idx on public.search_console_sites (client_id);

drop trigger if exists set_search_console_sites_updated_at on public.search_console_sites;
create trigger set_search_console_sites_updated_at
  before update on public.search_console_sites
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê search_console_sites" on public.search_console_sites;
create policy "Equipe interna lê search_console_sites"
  on public.search_console_sites for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia search_console_sites" on public.search_console_sites;
create policy "Equipe interna gerencia search_console_sites"
  on public.search_console_sites for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- Consultas — janela mais recente sincronizada (não série histórica
-- infinita por dia), mesmo espírito consolidado do restante da fase.
create table if not exists public.search_console_queries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  site_id uuid not null references public.search_console_sites (id) on delete cascade,
  query text not null,
  clicks integer not null default 0,
  impressions integer not null default 0,
  ctr numeric(7, 4),
  position numeric(6, 2),
  period_start date not null,
  period_end date not null
);

alter table public.search_console_queries enable row level security;
create index if not exists search_console_queries_site_idx
  on public.search_console_queries (site_id, period_end desc);

drop policy if exists "Equipe interna lê search_console_queries" on public.search_console_queries;
create policy "Equipe interna lê search_console_queries"
  on public.search_console_queries for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia search_console_queries" on public.search_console_queries;
create policy "Equipe interna gerencia search_console_queries"
  on public.search_console_queries for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

create table if not exists public.search_console_pages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  site_id uuid not null references public.search_console_sites (id) on delete cascade,
  page_url text not null,
  clicks integer not null default 0,
  impressions integer not null default 0,
  ctr numeric(7, 4),
  position numeric(6, 2),
  period_start date not null,
  period_end date not null
);

alter table public.search_console_pages enable row level security;
create index if not exists search_console_pages_site_idx
  on public.search_console_pages (site_id, period_end desc);

drop policy if exists "Equipe interna lê search_console_pages" on public.search_console_pages;
create policy "Equipe interna lê search_console_pages"
  on public.search_console_pages for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia search_console_pages" on public.search_console_pages;
create policy "Equipe interna gerencia search_console_pages"
  on public.search_console_pages for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

create table if not exists public.search_console_sitemaps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  site_id uuid not null references public.search_console_sites (id) on delete cascade,
  sitemap_url text not null,
  status text,
  is_pending boolean not null default false,
  errors_count integer not null default 0,
  warnings_count integer not null default 0,
  submitted_at timestamptz,
  last_downloaded_at timestamptz,

  unique (site_id, sitemap_url)
);

alter table public.search_console_sitemaps enable row level security;
create index if not exists search_console_sitemaps_site_idx on public.search_console_sitemaps (site_id);

drop trigger if exists set_search_console_sitemaps_updated_at on public.search_console_sitemaps;
create trigger set_search_console_sitemaps_updated_at
  before update on public.search_console_sitemaps
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê search_console_sitemaps" on public.search_console_sitemaps;
create policy "Equipe interna lê search_console_sitemaps"
  on public.search_console_sitemaps for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia search_console_sitemaps" on public.search_console_sitemaps;
create policy "Equipe interna gerencia search_console_sitemaps"
  on public.search_console_sitemaps for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
