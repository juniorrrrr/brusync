-- ============================================================================
-- Brusync OS — Fase 29: Meta Ads (Marketing API Oficial).
--
-- Aditivo apenas. Superfície própria (meta_accounts/meta_tokens/...), não uma
-- extensão do provider "meta_ads" já usado pela Central de Integrações desde
-- a Fase 6 — aquele é exclusivamente o Meta Conversions API/Pixel (Fase 9,
-- ver services/metaConversionsApi + services/conversionsHub) e continua
-- intocado. Este módulo usa o provider "meta_ads_manager" (catálogo no fim
-- deste arquivo) para nunca colidir com a integração de conversões já
-- existente. Nenhum módulo atual é refatorado.
--
-- Token de acesso é cifrado com a MESMA rotina AES-256-GCM da Fase 9/28
-- (services/metaConversionsApi/tokenCrypto.ts — reaproveitada, não
-- duplicada), chaveada por META_TOKEN_ENCRYPTION_KEY.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Contas conectadas — uma por identidade Meta (usuário ou system user) que
-- autorizou o app via OAuth. Pode enxergar N Business Managers.
-- ----------------------------------------------------------------------------
create table if not exists public.meta_accounts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  meta_user_id text not null unique,
  name text,
  email text,

  status text not null default 'desconectado' check (status in ('conectado', 'desconectado', 'erro')),
  last_sync_at timestamptz,
  error text,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.meta_accounts enable row level security;

drop trigger if exists set_meta_accounts_updated_at on public.meta_accounts;
create trigger set_meta_accounts_updated_at
  before update on public.meta_accounts
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê meta_accounts" on public.meta_accounts;
create policy "Equipe interna lê meta_accounts"
  on public.meta_accounts for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia meta_accounts" on public.meta_accounts;
create policy "Equipe interna gerencia meta_accounts"
  on public.meta_accounts for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Tokens — tabela própria (não colunas em meta_accounts) para permitir
-- histórico de renovação e checagem de expiração sem tocar na identidade da
-- conta. Um token "vigente" por conta (o mais recente); renovar insere uma
-- nova linha em vez de sobrescrever, para auditoria.
-- ----------------------------------------------------------------------------
create table if not exists public.meta_tokens (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  account_id uuid not null references public.meta_accounts (id) on delete cascade,
  access_token_ciphertext text not null,
  access_token_iv text not null,
  token_type text not null default 'long_lived' check (token_type in ('short_lived', 'long_lived', 'system_user')),
  scopes text[] not null default '{}',
  expires_at timestamptz,
  revoked_at timestamptz
);

alter table public.meta_tokens enable row level security;

create index if not exists meta_tokens_account_idx on public.meta_tokens (account_id, created_at desc);

drop policy if exists "Equipe interna lê meta_tokens" on public.meta_tokens;
create policy "Equipe interna lê meta_tokens"
  on public.meta_tokens for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia meta_tokens" on public.meta_tokens;
create policy "Equipe interna gerencia meta_tokens"
  on public.meta_tokens for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Business Managers visíveis pela conta conectada.
-- ----------------------------------------------------------------------------
create table if not exists public.meta_businesses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  account_id uuid not null references public.meta_accounts (id) on delete cascade,
  meta_business_id text not null unique,
  name text not null,
  verification_status text
);

alter table public.meta_businesses enable row level security;

create index if not exists meta_businesses_account_idx on public.meta_businesses (account_id);

drop trigger if exists set_meta_businesses_updated_at on public.meta_businesses;
create trigger set_meta_businesses_updated_at
  before update on public.meta_businesses
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê meta_businesses" on public.meta_businesses;
create policy "Equipe interna lê meta_businesses"
  on public.meta_businesses for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia meta_businesses" on public.meta_businesses;
create policy "Equipe interna gerencia meta_businesses"
  on public.meta_businesses for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Contas de anúncios — o vínculo com CRM (client_id/responsible_id) é só
-- referência, nunca cópia de dado do cliente.
-- ----------------------------------------------------------------------------
create table if not exists public.meta_ad_accounts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  account_id uuid not null references public.meta_accounts (id) on delete cascade,
  business_id uuid references public.meta_businesses (id) on delete set null,
  meta_ad_account_id text not null unique,
  name text not null,
  currency text not null default 'BRL',
  timezone_name text,
  account_status text,

  client_id uuid references public.clients (id) on delete set null,
  responsible_id uuid references public.profiles (id) on delete set null
);

alter table public.meta_ad_accounts enable row level security;

create index if not exists meta_ad_accounts_account_idx on public.meta_ad_accounts (account_id);
create index if not exists meta_ad_accounts_business_idx on public.meta_ad_accounts (business_id);
create index if not exists meta_ad_accounts_client_idx on public.meta_ad_accounts (client_id);

drop trigger if exists set_meta_ad_accounts_updated_at on public.meta_ad_accounts;
create trigger set_meta_ad_accounts_updated_at
  before update on public.meta_ad_accounts
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê meta_ad_accounts" on public.meta_ad_accounts;
create policy "Equipe interna lê meta_ad_accounts"
  on public.meta_ad_accounts for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia meta_ad_accounts" on public.meta_ad_accounts;
create policy "Equipe interna gerencia meta_ad_accounts"
  on public.meta_ad_accounts for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Campanhas — vínculo com Projetos (Fase 12) é só referência opcional.
-- ----------------------------------------------------------------------------
create table if not exists public.meta_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  ad_account_id uuid not null references public.meta_ad_accounts (id) on delete cascade,
  meta_campaign_id text not null unique,
  name text not null,
  objective text,
  status text not null default 'PAUSED',
  effective_status text,
  daily_budget numeric(14, 2),
  lifetime_budget numeric(14, 2),
  budget_remaining numeric(14, 2),
  start_time timestamptz,
  stop_time timestamptz,

  crm_project_id uuid references public.crm_projects (id) on delete set null
);

alter table public.meta_campaigns enable row level security;

create index if not exists meta_campaigns_ad_account_idx on public.meta_campaigns (ad_account_id);
create index if not exists meta_campaigns_status_idx on public.meta_campaigns (status);

drop trigger if exists set_meta_campaigns_updated_at on public.meta_campaigns;
create trigger set_meta_campaigns_updated_at
  before update on public.meta_campaigns
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê meta_campaigns" on public.meta_campaigns;
create policy "Equipe interna lê meta_campaigns"
  on public.meta_campaigns for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia meta_campaigns" on public.meta_campaigns;
create policy "Equipe interna gerencia meta_campaigns"
  on public.meta_campaigns for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Conjuntos de anúncios.
-- ----------------------------------------------------------------------------
create table if not exists public.meta_ad_sets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  campaign_id uuid not null references public.meta_campaigns (id) on delete cascade,
  meta_ad_set_id text not null unique,
  name text not null,
  status text not null default 'PAUSED',
  effective_status text,
  daily_budget numeric(14, 2),
  lifetime_budget numeric(14, 2),
  optimization_goal text,
  billing_event text,
  targeting jsonb not null default '{}'::jsonb,
  start_time timestamptz,
  end_time timestamptz
);

alter table public.meta_ad_sets enable row level security;

create index if not exists meta_ad_sets_campaign_idx on public.meta_ad_sets (campaign_id);
create index if not exists meta_ad_sets_status_idx on public.meta_ad_sets (status);

drop trigger if exists set_meta_ad_sets_updated_at on public.meta_ad_sets;
create trigger set_meta_ad_sets_updated_at
  before update on public.meta_ad_sets
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê meta_ad_sets" on public.meta_ad_sets;
create policy "Equipe interna lê meta_ad_sets"
  on public.meta_ad_sets for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia meta_ad_sets" on public.meta_ad_sets;
create policy "Equipe interna gerencia meta_ad_sets"
  on public.meta_ad_sets for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Criativos — imagem/vídeo referenciados por URL da própria Meta (CDN);
-- nenhum binário é baixado ou re-hospedado no Storage do Brusync.
-- ----------------------------------------------------------------------------
create table if not exists public.meta_creatives (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  ad_account_id uuid not null references public.meta_ad_accounts (id) on delete cascade,
  meta_creative_id text not null unique,
  name text,
  kind text not null default 'imagem' check (kind in ('imagem', 'video', 'carrossel', 'texto')),
  thumbnail_url text,
  image_url text,
  video_url text,
  headline text,
  body text,
  description text,
  call_to_action text,
  status text
);

alter table public.meta_creatives enable row level security;

create index if not exists meta_creatives_ad_account_idx on public.meta_creatives (ad_account_id);

drop trigger if exists set_meta_creatives_updated_at on public.meta_creatives;
create trigger set_meta_creatives_updated_at
  before update on public.meta_creatives
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê meta_creatives" on public.meta_creatives;
create policy "Equipe interna lê meta_creatives"
  on public.meta_creatives for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia meta_creatives" on public.meta_creatives;
create policy "Equipe interna gerencia meta_creatives"
  on public.meta_creatives for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Anúncios — a unidade folha (ad_set + creative).
-- ----------------------------------------------------------------------------
create table if not exists public.meta_ads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  ad_set_id uuid not null references public.meta_ad_sets (id) on delete cascade,
  creative_id uuid references public.meta_creatives (id) on delete set null,
  meta_ad_id text not null unique,
  name text not null,
  status text not null default 'PAUSED',
  effective_status text
);

alter table public.meta_ads enable row level security;

create index if not exists meta_ads_ad_set_idx on public.meta_ads (ad_set_id);
create index if not exists meta_ads_status_idx on public.meta_ads (status);

drop trigger if exists set_meta_ads_updated_at on public.meta_ads;
create trigger set_meta_ads_updated_at
  before update on public.meta_ads
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê meta_ads" on public.meta_ads;
create policy "Equipe interna lê meta_ads"
  on public.meta_ads for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia meta_ads" on public.meta_ads;
create policy "Equipe interna gerencia meta_ads"
  on public.meta_ads for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Públicos (Custom / Lookalike / Saved Audiences).
-- ----------------------------------------------------------------------------
create table if not exists public.meta_audiences (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  ad_account_id uuid not null references public.meta_ad_accounts (id) on delete cascade,
  meta_audience_id text not null unique,
  name text not null,
  kind text not null default 'custom' check (kind in ('custom', 'lookalike', 'saved')),
  approximate_count bigint,
  status text,
  origin text
);

alter table public.meta_audiences enable row level security;

create index if not exists meta_audiences_ad_account_idx on public.meta_audiences (ad_account_id);

drop trigger if exists set_meta_audiences_updated_at on public.meta_audiences;
create trigger set_meta_audiences_updated_at
  before update on public.meta_audiences
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê meta_audiences" on public.meta_audiences;
create policy "Equipe interna lê meta_audiences"
  on public.meta_audiences for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia meta_audiences" on public.meta_audiences;
create policy "Equipe interna gerencia meta_audiences"
  on public.meta_audiences for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Insights — uma linha por (nível, entidade, dia). Nenhum cálculo de
-- indicador (ROAS/ROI/CPA) é feito ou guardado aqui — só os números brutos
-- que a Meta devolve; domain/metaAds/* deriva as taxas em memória, e
-- Analytics (domain/analytics/metricsCatalog.ts) é quem exibe.
-- ----------------------------------------------------------------------------
create table if not exists public.meta_insights (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  ad_account_id uuid not null references public.meta_ad_accounts (id) on delete cascade,
  campaign_id uuid references public.meta_campaigns (id) on delete cascade,
  ad_set_id uuid references public.meta_ad_sets (id) on delete cascade,
  ad_id uuid references public.meta_ads (id) on delete cascade,
  level text not null check (level in ('account', 'campaign', 'ad_set', 'ad')),
  date date not null,

  impressions bigint not null default 0,
  reach bigint not null default 0,
  frequency numeric(10, 4),
  clicks bigint not null default 0,
  spend numeric(14, 2) not null default 0,
  ctr numeric(10, 4),
  cpm numeric(14, 4),
  cpc numeric(14, 4),

  conversions bigint not null default 0,
  leads bigint not null default 0,
  purchases bigint not null default 0,
  revenue numeric(14, 2) not null default 0
);

alter table public.meta_insights enable row level security;

create index if not exists meta_insights_ad_account_idx on public.meta_insights (ad_account_id, date desc);
create index if not exists meta_insights_campaign_idx on public.meta_insights (campaign_id, date desc);
create unique index if not exists meta_insights_unique_idx on public.meta_insights (
  ad_account_id,
  level,
  date,
  coalesce(campaign_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(ad_set_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(ad_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

drop policy if exists "Equipe interna lê meta_insights" on public.meta_insights;
create policy "Equipe interna lê meta_insights"
  on public.meta_insights for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia meta_insights" on public.meta_insights;
create policy "Equipe interna gerencia meta_insights"
  on public.meta_insights for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Eventos de conversão sincronizados por campanha/anúncio (actions/
-- action_values do Insights da Meta) — nunca a fila de disparo do Meta
-- Conversions API (essa é conversion_events/conversion_deliveries da Fase 8,
-- intocada). Aqui é só o que a própria Meta já atribuiu à campanha.
-- ----------------------------------------------------------------------------
create table if not exists public.meta_conversion_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  ad_account_id uuid not null references public.meta_ad_accounts (id) on delete cascade,
  campaign_id uuid references public.meta_campaigns (id) on delete cascade,
  ad_id uuid references public.meta_ads (id) on delete cascade,
  date date not null,
  event_name text not null check (event_name in (
    'Purchase', 'Lead', 'CompleteRegistration', 'AddToCart', 'ViewContent', 'PageView'
  )),
  event_count bigint not null default 0,
  value numeric(14, 2) not null default 0,
  currency text not null default 'BRL'
);

alter table public.meta_conversion_events enable row level security;

create index if not exists meta_conversion_events_ad_account_idx
  on public.meta_conversion_events (ad_account_id, date desc);
create unique index if not exists meta_conversion_events_unique_idx on public.meta_conversion_events (
  ad_account_id,
  date,
  event_name,
  coalesce(campaign_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(ad_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

drop policy if exists "Equipe interna lê meta_conversion_events" on public.meta_conversion_events;
create policy "Equipe interna lê meta_conversion_events"
  on public.meta_conversion_events for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia meta_conversion_events" on public.meta_conversion_events;
create policy "Equipe interna gerencia meta_conversion_events"
  on public.meta_conversion_events for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Fila de sincronização — mesmo espírito de automation_executions (Fase 10):
-- uma linha por execução, com attempts/next_attempt_at para o backoff
-- exponencial do cron (app/api/cron/meta-ads-sync).
-- ----------------------------------------------------------------------------
create table if not exists public.meta_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  account_id uuid not null references public.meta_accounts (id) on delete cascade,
  ad_account_id uuid references public.meta_ad_accounts (id) on delete cascade,
  job_type text not null check (job_type in (
    'businesses', 'ad_accounts', 'campaigns', 'ad_sets', 'ads', 'creatives',
    'audiences', 'insights', 'conversions', 'full'
  )),
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

alter table public.meta_sync_jobs enable row level security;

create index if not exists meta_sync_jobs_status_idx on public.meta_sync_jobs (status, next_attempt_at);
create index if not exists meta_sync_jobs_account_idx on public.meta_sync_jobs (account_id, created_at desc);

drop trigger if exists set_meta_sync_jobs_updated_at on public.meta_sync_jobs;
create trigger set_meta_sync_jobs_updated_at
  before update on public.meta_sync_jobs
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê meta_sync_jobs" on public.meta_sync_jobs;
create policy "Equipe interna lê meta_sync_jobs"
  on public.meta_sync_jobs for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia meta_sync_jobs" on public.meta_sync_jobs;
create policy "Equipe interna gerencia meta_sync_jobs"
  on public.meta_sync_jobs for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Catálogo da Central de Integrações — provider próprio ("meta_ads_manager"),
-- nunca o "meta_ads" da Fase 6/9 (Pixel/Conversions API), para não colidir
-- com o card e o fluxo de teste de conexão já existentes.
-- ----------------------------------------------------------------------------
insert into public.integrations (provider, category, name, description, status, enabled)
values (
  'meta_ads_manager',
  'marketing',
  'Meta Ads Manager',
  'Sincronize contas, campanhas, conjuntos, anúncios, criativos, públicos e métricas do Meta Ads (Marketing API oficial).',
  'em_desenvolvimento',
  false
)
on conflict (provider) do nothing;
