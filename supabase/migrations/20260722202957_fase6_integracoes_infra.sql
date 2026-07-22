-- ============================================================================
-- Brusync OS — Fase 6: infraestrutura de Integrações (aditivo apenas).
--
-- Esta fase NÃO conecta nenhuma plataforma real (Meta Ads, Google Ads, GA4,
-- WhatsApp, etc). Cria apenas a estrutura de dados que os módulos futuros vão
-- usar: o catálogo de integrações (public.integrations), o log de execução/
-- sincronização de cada uma (public.integration_logs) e o Event Bus — a fila
-- de eventos de domínio que o CRM publica sem conhecer quem os consome
-- (public.integration_events, um outbox: o CRM só grava aqui; um futuro
-- dispatcher lê as linhas "pending" e decide os destinos).
--
-- Nenhuma tabela existente é alterada ou removida.
-- ============================================================================

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Identidade estável da integração (ex: "meta_ads", "google_ads", "n8n").
  -- Nunca muda depois de criado — é a chave que o código usa para localizar
  -- a linha, o nome de exibição (name) pode mudar livremente.
  provider text not null,
  category text not null
    check (category in ('publicidade', 'analytics', 'comunicacao', 'automacao', 'developer')),
  name text not null,
  description text,

  status text not null default 'desconectado'
    check (status in ('conectado', 'desconectado', 'erro', 'em_desenvolvimento')),
  enabled boolean not null default false,

  connected_at timestamptz,
  last_sync timestamptz,
  next_sync timestamptz,

  -- Configuração não-sensível (ex: frequência de sync, flags). Nenhuma
  -- credencial/token real deve ser gravada aqui nesta fase — não existe
  -- ainda um cofre de segredos (ver limitações no relatório da Fase 6).
  config jsonb not null default '{}'::jsonb,
  error text,

  -- 0–100, calculado por um futuro job de monitoramento a partir da taxa de
  -- sucesso dos logs recentes. Nulo enquanto não há dado suficiente.
  health_score integer check (health_score is null or health_score between 0 and 100)
);

alter table public.integrations enable row level security;

create unique index if not exists integrations_provider_idx on public.integrations (provider);
create index if not exists integrations_category_idx on public.integrations (category);
create index if not exists integrations_status_idx on public.integrations (status);

drop trigger if exists set_integrations_updated_at on public.integrations;
create trigger set_integrations_updated_at
  before update on public.integrations
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê integrations" on public.integrations;
create policy "Equipe interna lê integrations"
  on public.integrations for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza integrations" on public.integrations;
create policy "Equipe interna atualiza integrations"
  on public.integrations for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Log de execução por integração: sincronizações, tentativas de entrega de
-- evento, chamadas de webhook recebidas — qualquer coisa que aconteça "de
-- fora para dentro" ou "de dentro para fora" de uma integração. Alimenta a
-- tela de Logs e o dashboard de Saúde.
-- ----------------------------------------------------------------------------
create table if not exists public.integration_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  integration_id uuid references public.integrations (id) on delete cascade,
  event text not null,
  status text not null check (status in ('success', 'error', 'pending')),
  message text,
  payload jsonb,
  origin text,
  destination text,
  duration_ms integer
);

alter table public.integration_logs enable row level security;

create index if not exists integration_logs_integration_created_idx
  on public.integration_logs (integration_id, created_at desc);
create index if not exists integration_logs_status_idx on public.integration_logs (status);
create index if not exists integration_logs_created_idx on public.integration_logs (created_at desc);

drop policy if exists "Equipe interna lê integration_logs" on public.integration_logs;
create policy "Equipe interna lê integration_logs"
  on public.integration_logs for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria integration_logs" on public.integration_logs;
create policy "Equipe interna cria integration_logs"
  on public.integration_logs for insert
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Event Bus: outbox de eventos de domínio. O CRM (Leads, Tarefas, Clientes)
-- publica linhas aqui através de um único serviço (services/eventBus) e nunca
-- conhece quem vai processá-las — nesta fase ninguém processa (status fica
-- "pending" para sempre); um futuro dispatcher fará o fan-out para os
-- destinos reais (Meta Conversions API, GA4 Measurement Protocol, Webhooks,
-- Slack, N8N, ...), registrando cada tentativa em integration_logs.
-- ----------------------------------------------------------------------------
create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  event_type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,

  status text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  processed_at timestamptz,
  actor_id uuid references public.profiles (id) on delete set null
);

alter table public.integration_events enable row level security;

create index if not exists integration_events_type_created_idx
  on public.integration_events (event_type, created_at desc);
create index if not exists integration_events_status_idx on public.integration_events (status);

drop policy if exists "Equipe interna lê integration_events" on public.integration_events;
create policy "Equipe interna lê integration_events"
  on public.integration_events for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria integration_events" on public.integration_events;
create policy "Equipe interna cria integration_events"
  on public.integration_events for insert
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Catálogo inicial: uma linha por provider já conhecido, todas em
-- status "em_desenvolvimento"/desabilitadas — nenhuma credencial, nenhuma
-- conexão real. Idempotente (on conflict do nothing), seguro de rodar de novo.
-- ----------------------------------------------------------------------------
insert into public.integrations (provider, category, name, description, status, enabled)
values
  ('meta_ads', 'publicidade', 'Meta Ads', 'Conecte campanhas do Facebook e Instagram Ads para sincronizar leads e conversões.', 'em_desenvolvimento', false),
  ('google_ads', 'publicidade', 'Google Ads', 'Sincronize conversões e público-alvo diretamente com o Google Ads.', 'em_desenvolvimento', false),
  ('tiktok_ads', 'publicidade', 'TikTok Ads', 'Envie eventos de conversão para campanhas do TikTok Ads.', 'em_desenvolvimento', false),
  ('linkedin_ads', 'publicidade', 'LinkedIn Ads', 'Conecte campanhas B2B do LinkedIn Ads ao funil comercial.', 'em_desenvolvimento', false),
  ('microsoft_ads', 'publicidade', 'Microsoft Ads', 'Sincronize conversões com o Microsoft Advertising (Bing Ads).', 'em_desenvolvimento', false),
  ('ga4', 'analytics', 'Google Analytics 4', 'Envie eventos de negócio para o GA4 via Measurement Protocol.', 'em_desenvolvimento', false),
  ('gtm', 'analytics', 'Google Tag Manager', 'Gerencie tags e disparos de eventos do Brusync OS.', 'em_desenvolvimento', false),
  ('search_console', 'analytics', 'Google Search Console', 'Acompanhe desempenho orgânico e indexação do site.', 'em_desenvolvimento', false),
  ('clarity', 'analytics', 'Microsoft Clarity', 'Sessões e mapas de calor para entender o comportamento do visitante.', 'em_desenvolvimento', false),
  ('whatsapp', 'comunicacao', 'WhatsApp Business', 'Envie notificações automáticas de leads e tarefas pelo WhatsApp.', 'em_desenvolvimento', false),
  ('slack', 'comunicacao', 'Slack', 'Receba alertas de leads, tarefas e campanhas em canais do Slack.', 'em_desenvolvimento', false),
  ('discord', 'comunicacao', 'Discord', 'Envie notificações da operação comercial para um servidor Discord.', 'em_desenvolvimento', false),
  ('gmail', 'comunicacao', 'Gmail', 'Sincronize e envie e-mails do funil comercial pelo Gmail.', 'em_desenvolvimento', false),
  ('outlook', 'comunicacao', 'Outlook', 'Sincronize e envie e-mails do funil comercial pelo Outlook.', 'em_desenvolvimento', false),
  ('n8n', 'automacao', 'N8N', 'Dispare workflows customizados do N8N a partir de eventos do Brusync.', 'em_desenvolvimento', false),
  ('make', 'automacao', 'Make', 'Conecte o Brusync a milhares de apps via cenários do Make (antigo Integromat).', 'em_desenvolvimento', false),
  ('zapier', 'automacao', 'Zapier', 'Dispare Zaps automaticamente a partir de eventos do CRM.', 'em_desenvolvimento', false),
  ('api', 'developer', 'API Brusync', 'Acesso programático de leitura e escrita aos dados do Brusync OS.', 'em_desenvolvimento', false),
  ('webhook', 'developer', 'Webhooks', 'Receba eventos do Brusync em tempo real no seu próprio endpoint.', 'em_desenvolvimento', false),
  ('sdk', 'developer', 'SDK', 'Bibliotecas cliente para integrar o Brusync a aplicações próprias.', 'em_desenvolvimento', false)
on conflict (provider) do nothing;
