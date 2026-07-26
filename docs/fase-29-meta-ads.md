# Fase 29 — Meta Ads (Marketing API Oficial)

Data: 2026-07-26
Escopo: novo módulo `/meta-ads` — OAuth, sincronização de contas/campanhas/
criativos/públicos/insights, dashboard, alertas, vínculo com CRM, wiring em
Central de Integrações, Analytics e Marketing Intelligence, Modo Demonstração.

---

## Decisão de arquitetura mais importante

O provider `meta_ads` já existia na Central de Integrações desde a Fase 6,
mas é exclusivamente o **Meta Conversions API / Pixel** (Fase 9) —
`services/metaConversionsApi/*`, `services/conversionsHub/*`. Essa
integração continua **100% intocada**.

Este módulo (Marketing API — contas, campanhas, criativos, públicos,
insights) é uma superfície nova e própria, registrada sob o provider
**`meta_ads_manager`** (card "Meta Ads Manager" na Central de Integrações),
exatamente pelo mesmo motivo que levou a Fase 28 a criar
`whatsapp_conversations`/`whatsapp_messages` em vez de estender
`crm_conversations`/`crm_messages`: são conceitos e tabelas diferentes, e
"nenhum módulo atual deve ser refatorado". Reaproveitar a chave `meta_ads`
teria colidido com o formulário e o teste de conexão do Pixel já em uso.

## Arquitetura (Provider Pattern)

```
domain/metaAds/provider.ts        → interface MetaAdsProvider (11 métodos)
services/metaAds/metaMarketingProvider.ts → única implementação real (Graph Marketing API v19)
services/metaAds/metaAdsProviderFactory.ts → fábrica única (mesmo padrão de services/whatsapp/whatsappProviderFactory.ts)
```

Toda a aplicação fala com a Meta exclusivamente através de
`getMetaAdsProvider()`. Um futuro provider de sandbox (testes de
integração sem bater na Graph API real) implementa a mesma interface e o
único arquivo que muda é a fábrica.

Camadas (mesmo padrão de Fase 28/25/27):

```
domain/metaAds       → provider.ts, statusMeta.ts, metrics.ts, alerts.ts, syncBackoff.ts (regras puras, zero I/O)
repositories/metaAds → 12 arquivos, um por tabela, único lugar que fala com o Supabase
services/metaAds     → provider real, OAuth, sync engine, dashboard, alertas, CRM link, conversions prep
application/metaAds  → Server Actions + queries finas (guard de sessão + Modo Demonstração)
hooks/metaAds         → useMetaAdsSync (client, useTransition)
contexts/metaAds      → MetaAdsFilterProvider (compõe hooks/crm/useUpdateSearchParams — não duplica)
components/metaAds   → 10 componentes de UI, nenhuma regra de negócio
app/(crm)/(app)/meta-ads → 5 páginas (dashboard, campanhas, criativos, públicos, configurações)
app/api/meta-ads/oauth   → start + callback
app/api/cron/meta-ads-sync → cron diário (fila + retry/backoff)
```

## Banco de dados

12 tabelas aditivas (`supabase/migrations/20260802090000_fase29_meta_ads.sql`),
todas com RLS via `is_internal_staff()`, mesmo padrão de toda tabela
`crm_*`/`whatsapp_*` já existente:

`meta_accounts`, `meta_tokens` (tabela própria, histórico de renovação —
nunca sobrescreve), `meta_businesses`, `meta_ad_accounts` (com `client_id`/
`responsible_id` → CRM), `meta_campaigns` (com `crm_project_id` opcional),
`meta_ad_sets`, `meta_ads`, `meta_creatives` (URLs da própria CDN da Meta,
nenhum binário é baixado ou re-hospedado no Storage do Brusync),
`meta_audiences`, `meta_insights` (números brutos — nenhuma taxa
calculada/persistida), `meta_conversion_events` (o que a própria Meta já
atribuiu às campanhas, distinto da fila de disparo do Conversions API),
`meta_sync_jobs` (fila com `attempts`/`next_attempt_at`, mesmo espírito de
`automation_executions`).

Token cifrado com a mesma rotina AES-256-GCM já usada pelas Fases 9/28
(`services/metaConversionsApi/tokenCrypto.ts`, chaveada por
`META_TOKEN_ENCRYPTION_KEY`) — nenhuma rotina de criptografia nova.

Migration aplicada em produção e verificada (12/12 tabelas + linha do
catálogo `integrations` confirmadas via consulta direta).

## OAuth

`app/api/meta-ads/oauth/start` (exige sessão, gera `state` CSRF em cookie
httpOnly de 10 min, redireciona para o diálogo da Meta) →
`app/api/meta-ads/oauth/callback` (valida `state`, troca `code` por token
curto, troca por token de longa duração, salva conta + token cifrado,
enfileira a primeira sincronização completa) → volta para
`/meta-ads/configuracoes?connected=1`.

Escopos pedidos: `ads_management`, `ads_read`, `business_management`,
`read_insights`.

**Variáveis novas exigidas** (documentadas em `.env.example`):
`META_ADS_APP_ID`, `META_ADS_APP_SECRET` — credenciais de um app da Meta
com o produto "Marketing API" habilitado. Sem elas, a tela Configurações
mostra o botão "Conectar" desabilitado com aviso explícito, nunca falha
silenciosamente.

## Sincronização

Fila (`meta_sync_jobs`) com `job_type` (`full` | `insights` | ...),
`status`, `attempts`/`max_attempts` (5), `next_attempt_at`. Backoff
exponencial idêntico ao já usado pelo retry de conversões da Fase 8
(`domain/metaAds/syncBackoff.ts`, réplica do schedule de
`app/api/cron/meta-retry/route.ts`): 1min → 5min → 30min → 2h → 6h.

- **Manual**: botão "Sincronizar agora" enfileira e processa na mesma
  chamada (`triggerManualSyncAction`) — feedback imediato.
- **Automática**: `app/api/cron/meta-ads-sync` (novo cron, `vercel.json`,
  `0 6 * * *`, protegido por `CRON_SECRET` — mesmo padrão de
  `meta-retry`/`whatsapp-scheduled-triggers`) enfileira um job `insights`
  incremental (últimos 3 dias) por conta conectada e processa a fila.
- **Full sync** (primeira conexão): businesses → contas de anúncios →
  criativos → campanhas → conjuntos → anúncios → públicos → insights (30
  dias, 4 níveis: conta/campanha/conjunto/anúncio, uma chamada por nível
  via `time_increment=1` — não uma chamada por entidade) → eventos de
  conversão.

Boas práticas aplicadas: paginação completa (`paging.next`), 150ms entre
páginas, `Promise` sequencial (nunca paralelo, para não estourar rate
limit), timeout/erro tratado por chamada, logs estruturados via
`meta_sync_jobs.error`/`stats`.

## Dashboard, alertas e métricas

Nenhuma taxa é calculada em mais de um lugar: `domain/metaAds/metrics.ts`
(`deriveMetrics`) é a única fonte de CTR/CPM/CPC/CPA/ROAS/ROI, consumida
pelo dashboard real, pelo Modo Demonstração e por Analytics.

`domain/metaAds/alerts.ts` (função pura, sem I/O) computa: campanha
pausada, campanha ativa sem gasto em 7 dias, CPA elevado (> R$150), ROAS
baixo (< 1.5x), anúncio reprovado, conta desconectada, token expirando
(≤ 7 dias), falha de sincronização. `services/metaAds/metaAdsAlertsService.ts`
alimenta com dados reais; nenhum componente decide o que é alerta.

## Central de Integrações

Novo card "Meta Ads Manager" (`domain/integrations/providers.ts`), teste de
conexão real (`connectionTestService.ts` → `provider.validateToken()`,
aditivo — o branch existente do `meta_ads`/Pixel não foi tocado), link "Ver
painel completo" no Drawer apontando para `/meta-ads/configuracoes`.

## Analytics

Nova fonte `meta_ads` (`types/analytics.ts`, `domain/analytics/
metricsCatalog.ts`) com 4 métricas (`investimento_meta_ads`,
`roas_meta_ads`, `cpa_meta_ads`, `conversoes_meta_ads`). O resolver
(`services/analytics/analyticsMetricsService.ts::resolveMetaAds`) só
reformata o que `fetchMetaAdsDashboardData()` já calculou — zero SQL,
zero recálculo, mesmo padrão dos outros 12 `resolve*` já existentes.

**Decisão consciente**: não foi misturado no CAC/ROI/ROAS de "Marketing"
já existente (`application/marketingAnalytics/spend.ts`, alimentado por
investimento **digitado manualmente**, `campaignSpendRepository`). São
duas fontes de dado genuinamente diferentes (manual vs. sincronizado da
API); uni-las silenciosamente mudaria um número que times de marketing já
usam para orçamento, sem confirmação. Meta Ads aparece como fonte própria
e adicional no construtor de dashboards.

## CRM

`meta_ad_accounts.client_id`/`responsible_id` e `meta_campaigns.crm_project_id`
são só FK (nunca cópia de dado). Tela Configurações permite vincular cada
conta de anúncios a um Cliente/Responsável (reaproveitando
`repositories/crm/clientsRepository.ts` e `application/crm/leadsQueries.ts::
getOwnerOptions` — nenhuma consulta de clientes/responsáveis nova); tabela
de Campanhas permite vincular a um Projeto (`repositories/projects/
projectsRepository.ts`, idem).

## Conversões (Meta Conversions API)

Por instrução explícita ("preparar integração"), o escopo desta fase é
modelagem, não um segundo dispatcher: `meta_conversion_events` guarda os
eventos que a própria Meta já atribuiu à campanha (via `actions`/
`action_values` do Insights), usando os **mesmos nomes de evento** do
Conversions API (`domain/metaConversionsApi/eventNames.ts`, Fase 9) para
nunca ter dois vocabulários. O disparo real (server-side, Pixel/CAPI)
continua 100% em `services/conversionsHub/dispatchMetaDelivery.ts` —
nenhuma fila nova de disparo foi criada.

## Modo Demonstração

`lib/demo/mockMetaAds.ts`: 1 conta conectada, 1 Business Manager, 2 contas
de anúncios (vinculadas a `DEMO_STANDALONE_CLIENTS`/`DEMO_OWNERS` já
usados por CRM/WhatsApp), 5 campanhas com objetivos variados, 5 criativos
(um reprovado, de propósito, para popular o alerta), 5 públicos, série
diária de 30 dias determinística (sem `Math.random`, mesmo padrão de
`mockAnalytics.ts`) e 2 sync jobs (um concluído, um falhado, para popular
o alerta de sincronização). Nenhuma gravação real ocorre — todo o dataset
é gerado em memória a cada chamada.

Testado manualmente em build de produção local: dashboard, campanhas,
criativos, públicos e configurações renderizando corretamente com números
coerentes (ROAS 3.20x, CPA R$ 57,86 — corrigido um bug de fórmula na
geração dos dados fictícios que produzia ROAS de 3760x antes da
verificação).

## Validação

- `npm run typecheck` — ✅ sem erros.
- `npm run lint` (Biome) — ✅ sem avisos novos (1 aviso pré-existente e
  não relacionado em `TeamMemberAvatar.tsx`, fora do escopo desta fase).
- `npm run build` — ✅ build de produção concluído, todas as rotas
  (`/meta-ads`, `/meta-ads/campanhas`, `/meta-ads/criativos`,
  `/meta-ads/publicos`, `/meta-ads/configuracoes`, `/api/meta-ads/oauth/
  start`, `/api/meta-ads/oauth/callback`, `/api/cron/meta-ads-sync`)
  geradas normalmente.
- Migration aplicada em produção e verificada (12/12 tabelas).
- Modo Demonstração validado visualmente nas 5 telas.
- CRM, Central de Integrações, Analytics e Marketing Intelligence
  verificados por leitura de código — sem regra duplicada.

## Ação pendente do usuário

Para conectar uma conta real, cadastre um app em
[developers.facebook.com](https://developers.facebook.com) com o produto
"Marketing API" habilitado e defina na Vercel:

```
META_ADS_APP_ID=
META_ADS_APP_SECRET=
```

Sem essas variáveis o módulo funciona normalmente (Modo Demonstração,
navegação, Central de Integrações), só o botão "Conectar com a Meta" fica
desabilitado com aviso explícito.
