# Fase 35 — Evolução da Central de Integrações (Google)

Data: 2026-07-26
Escopo: Google Ads, Google Analytics 4, Google Tag Manager e Google Search
Console passam de "em desenvolvimento" para conexões reais, implementando
`IntegrationProvider` (Fase 34) — sem nenhuma página, módulo ou item de
menu novos.

---

## Decisão de escopo mais importante

Implementar os 4 produtos na mesma granularidade da Meta Ads (Fase 29) —
uma tabela por entidade (grupos de anúncios, anúncios individuais, tags/
triggers/variables do GTM cada um com histórico próprio, páginas
individuais do Search Console) — significaria replicar ~29 arquivos e 12
tabelas **quatro vezes**, sem nenhuma forma de testar contra as APIs reais
do Google neste ambiente. Perguntado como dimensionar, a escolha foi um
**modelo consolidado**: cada integração guarda a entidade raiz (conta
Ads/propriedade GA4/container GTM/site GSC) + métricas diárias agregadas
cobrindo literalmente toda métrica pedida no briefing, com campanhas e
keywords (as duas entidades que o CRM precisa referenciar) em tabela
própria, e sub-entidades que nenhuma tela vai listar em detalhe (grupos de
anúncios, tags/triggers/variables individuais, URLs individuais do GSC)
consolidadas em tabelas mais largas em vez de uma por entidade. Resultado:
15 tabelas novas ao todo, não 40+.

## Arquitetura — reaproveitando a Fase 34 integralmente

### Camada de segredos generalizada

`services/security/tokenCrypto.ts` — AES-256-GCM parametrizado pelo nome
da env var da chave (`encryptSecret(plaintext, envVarName)`). O módulo
específico do Meta (`services/metaConversionsApi/tokenCrypto.ts`, Fase 9)
agora delega para cá com a mesma assinatura externa — nenhum call site do
Meta precisou mudar.

### OAuth compartilhado, conexões independentes

`services/googleIntegrations/{googleOAuthClient,oauthState}.ts` — os 4
produtos autenticam contra **um** OAuth Client do Google Cloud
(`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`), cada um pedindo só o escopo
de que precisa (`adwords`, `analytics.readonly`,
`tagmanager.readonly`, `webmasters.readonly`) — mas cada um com sua
própria linha em `public.integrations`, seu próprio token, seu próprio
ciclo conectar/desconectar/sincronizar, exatamente como o Meta Ads já
funcionava. Um usuário pode conectar só o Search Console sem tocar nos
outros 3.

### `IntegrationProvider` ganha "Escolha da conta" genérica

Como nenhum dos 4 produtos tem página própria (a fase proíbe criar uma), a
interface (`domain/integrations/provider.ts`) ganhou:

```
needsEntitySelection(): Promise<boolean>
listSelectableEntities?(): Promise<IntegrationSelectableEntity[]>
selectEntity?(entityId: string): Promise<void>
getConnectUrl(): string | null
```

`components/integrations/GoogleEntityPicker.tsx` (novo, genérico — não um
componente por produto) é o que o Drawer da Central de Integrações
renderiza no lugar do formulário de notas enquanto
`needsEntitySelection()` for true: lista as contas/propriedades/
containers/sites descobertos no callback OAuth e deixa o usuário escolher
qual sincronizar. `application/integrationsCenter/selectEntityAction.ts`
é a Server Action por trás do clique.

### Fila de sincronização genérica (nova nesta fase)

A Fase 34 previu que a infraestrutura de sync seria "reutilizada
integralmente" pelas futuras integrações, mas o Meta Ads já tinha sua
própria fila (`meta_sync_jobs`) e não havia motivo para criar uma genérica
ainda. Agora há: `public.integration_sync_jobs` (nova, única migration
desta fase) + `repositories/integrations/integrationSyncJobsRepository.ts`
— retry/backoff exponencial via `domain/integrations/syncBackoff.ts`
(relocado de `domain/metaAds/` na Fase 34, já era 100% agnóstico de Meta).
Os 4 providers usam essa fila; `meta_sync_jobs` continua intocada.

`services/integrationsCenter/reflectSyncOutcome.ts` generaliza o
espelhamento de resultado de sync em `public.integrations`/
`integration_logs` que a Fase 34 escreveu só para o Meta Ads
(`reflectJobOutcomeOnIntegration`) — mesma lógica de saúde/status/log,
agora reutilizável por qualquer provider.

## Modelo de dados (migration `20260803090000`)

```
google_oauth_tokens         compartilhada pelos 4 (provider distingue qual)
integration_sync_jobs       fila genérica (Fase 34 previu, esta fase criou)

google_ads_accounts / _campaigns / _keywords / _insights_daily
ga4_properties / _metrics_daily / _dimension_breakdown_daily (channel|device|source)
gtm_containers / _entities (workspace|tag|trigger|variable) / _versions
search_console_sites / _queries / _pages / _sitemaps
```

`google_ads_insights_daily` e `search_console_queries/pages` são
**snapshots substituídos a cada sync** (delete + insert da janela), não
séries históricas por linha — mesma decisão consolidada, documentada nos
comentários dos repositórios correspondentes.

Migration aplicada e verificada em produção via `supabase db push`
(`supabase migration list` confirma `local == remote`).

## Central de Integrações

Cards Google Ads/GA4/GTM/Search Console ganham as mesmas ações do Meta Ads
Manager (Fase 34): Sincronizar agora, Desconectar, Testar conexão, Logs,
Saúde, Fila, Tempo médio, Expiração do token — mais o fluxo novo de
Conectar → GoogleEntityPicker específico desta fase, já que eles não têm
página própria.

## Marketing Intelligence / Analytics / IA

- `/marketing/executivo` ganhou `GoogleAdsSyncedPanel` ao lado do
  `MetaAdsSyncedPanel` já existente — mesmo padrão, reaproveita
  `fetchGoogleAdsDashboardData`, nenhuma consulta nova.
- Analytics (o construtor de dashboards da Fase 27) ganhou 3 novos
  `AnalyticsDataSource` (`google_ads`, `ga4`, `search_console`) com 4
  métricas cada em `domain/analytics/metricsCatalog.ts`, resolvidas em
  `services/analytics/analyticsMetricsService.ts` só reformatando
  `fetch*DashboardData` — o mesmo padrão que já existia para
  `investimento_meta_ads`/`roas_meta_ads`/etc. GTM não ganhou métricas
  (não tem números de desempenho — é ferramenta de gestão de tags).
- `MarketingInsightsInput` (IA) ganhou `googleAds`/`ga4`/`searchConsole`,
  populados em `buildMarketingAssistantContext()`. Nenhuma sugestão de IA
  lê esses campos ainda — "apenas disponibilização", como pedido.

## CRM

`services/googleIntegrations/googleCrmLinkService.ts::
suggestClientIdForEntityName` reaproveita exatamente o algoritmo de
`services/metaAds/metaAdsCrmLinkService.ts::suggestClientForAdAccount`
(substring bidirecional contra `company` dos clientes do CRM). Diferença
deliberada em relação ao Meta: como nenhum dos 4 produtos tem tela para o
usuário confirmar manualmente uma sugestão, o vínculo é aplicado
automaticamente no momento da seleção da conta/propriedade/container/site
— silenciosamente ignorado quando não há match, nunca bloqueia a seleção.
Aplica a `client_id` em `google_ads_accounts`/`ga4_properties`/
`gtm_containers`/`search_console_sites`; `crm_project_id` em
`google_ads_campaigns` fica disponível para uma futura tela vincular, sem
UI própria ainda (mesma situação do Meta antes de sua página de
configurações existir). "Origem"/"Canal"/"Keyword" continuam sendo
conceitos de classificação já existentes (`domain/marketing/
originRules.ts`) e dados já armazenados com FK para campanha
(`google_ads_keywords.campaign_id`), não novas tabelas de relação.

## Central de Operações

Nenhuma mudança de código. `getIntegrationHealthData()` já lia
genericamente `listIntegrations()` desde a Fase 34 — os 4 providers agora
aparecem lá automaticamente porque mantêm sua linha em
`public.integrations` honesta (mesmo mecanismo de write-through do Meta
Ads Manager).

## Modo Demonstração

`lib/demo/mockGoogleAds.ts`, `mockGa4.ts`, `mockGtm.ts`,
`mockSearchConsole.ts` — datasets determinísticos (sem `Math.random`,
mesmo padrão de `mockMetaAds.ts`). `lib/demo/mockIntegrations.ts`: os 4
providers entram em `DEMO_CONNECTED` (GTM e Search Console não estavam lá
antes; Google Ads e GA4 já apareciam "conectados" no catálogo demo por um
placeholder anterior à Fase 35 — agora isso é verdade). `syncNow()` de
cada provider simula um resultado coerente sem chamada real quando em
Modo Demonstração, mesmo padrão do Meta Ads Manager.

## Limitações conhecidas (documentadas no código, não escondidas)

- **Google Ads**: "Top campanhas" em `googleAdsQueries.ts` lista campanhas
  ativas sem quebra de gasto por campanha — o modelo consolidado só grava
  métricas diárias no nível da conta, não por campanha.
- **GTM**: a Tag Manager API v2 não expõe status ativo/pausado por tag na
  listagem nem um timestamp de publicação direto na versão — `published_at`
  usa o `fingerprint` (epoch de última modificação) como melhor
  aproximação disponível.
- **Search Console**: não há endpoint em lote para índice/cobertura (a URL
  Inspection API só inspeciona uma URL por vez) — `indexed_count`/
  `excluded_count` ficam `null` em vez de um número inventado.

## Ação pendente do usuário

Para conectar contas reais, cadastre um OAuth Client no
[Google Cloud Console](https://console.cloud.google.com) com as 4 APIs
habilitadas (Google Ads API, Analytics Admin + Data API, Tag Manager API,
Search Console API) e defina na Vercel:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_TOKEN_ENCRYPTION_KEY=   # openssl rand -base64 32
GOOGLE_ADS_DEVELOPER_TOKEN=    # só Google Ads — requer aprovação do Google
```

Sem essas variáveis, os 4 módulos funcionam normalmente (Modo
Demonstração, Central de Integrações, Central de Operações) — só o botão
"Conectar" fica com erro explícito em vez de simular sucesso.

## Validação

- `npm run typecheck` — ✅ sem erros.
- `npm run lint` (Biome) — ✅ sem avisos novos (1 aviso pré-existente e
  não relacionado em `TeamMemberAvatar.tsx`).
- `npm run build` — ✅ 120 rotas (108 + 12 novas rotas de API: 4 cron + 8
  OAuth start/callback) — **zero páginas novas**, zero itens de menu
  novos.
- Migration aplicada e verificada em produção (`supabase migration list`).
- `vercel.json` ganhou 4 crons novos (07h–10h, escalonados após o do Meta
  às 06h).
- OAuth, sincronização, logs, Central de Integrações, Analytics, Marketing
  Intelligence, CRM e Central de Operações verificados por leitura de
  código e pelos tipos (TypeScript fecha o contrato entre
  `IntegrationProvider` e cada consumidor, e entre cada REST client e sua
  interface de domínio).
- Modo Demonstração verificado por leitura de código (datasets
  determinísticos, nenhuma chamada real).
- **Não verificado interativamente no navegador**: mesma ressalva das
  Fases 33/34 — exige sessão Supabase Auth real. Recomenda-se conferir o
  fluxo Conectar → GoogleEntityPicker → Sincronizar agora em `/integracoes`
  para os 4 cards depois de configurar as credenciais do Google.
- Nenhum dado de teste foi criado — só código de produção e seeds do Modo
  Demonstração.

## Deploy

Commit `d0d74e2` → push `main` → `vercel --prod` →
**https://brusync.vercel.app**.
