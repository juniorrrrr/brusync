# Fase 34 — Evolução da Central de Integrações (Marketing)

Data: 2026-07-26
Escopo: camada genérica de Providers por baixo da Central de Integrações
(`domain/integrations/provider.ts`), com o Meta Ads (Fase 29) refatorado
para ser a primeira implementação real; nenhum módulo, página ou entrada de
menu novos.

---

## Decisão de escopo mais importante

O briefing desta fase diz "não criar páginas/módulo/menu Meta Ads" e "toda
configuração exclusivamente na Central de Integrações" — mas a Fase 29 já
tinha criado 5 páginas em `/meta-ads` (dashboard, campanhas, criativos,
públicos, configurações) com OAuth/sincronização reais, e a Fase 33 (mesmo
dia) já tinha adicionado "Meta Ads" ao menu lateral. Perguntado o que fazer
com esse conflito, a decisão foi: **manter `/meta-ads` e o item de menu
exatamente como estavam**, e usar esta fase inteira para construir a camada
`IntegrationProvider` por baixo, com o card de Integrações virando um
painel de controle adicional (não substituto) sobre o mesmo módulo. Nenhuma
página foi criada nesta fase — as que já existiam continuam existindo.

## Arquitetura (Provider Pattern genérico)

```
domain/integrations/provider.ts   → interface IntegrationProvider (getStatus, testConnection,
                                     syncNow, disconnect, getRecentLogs, getManageUrl, isImplemented)
domain/integrations/syncBackoff.ts → backoff exponencial genérico (relocado de domain/metaAds/,
                                     já era 100% agnóstico de Meta)
domain/integrations/health.ts     → computeHealthScore() genérico (0–100 por taxa de sucesso recente)
services/integrationsCenter/
  integrationProviderRegistry.ts  → getIntegrationProvider(key) — único ponto que uma futura
                                     integração (Google Ads, GA4, Search Console, TikTok Ads,
                                     LinkedIn Ads, Microsoft Ads) precisa tocar
  providers/metaAdsIntegrationProvider.ts → única implementação real, envolve
                                     services/metaAds/* já existentes (Fase 29) sem reescrever
                                     nenhuma regra de OAuth/sincronização
  providers/notImplementedProvider.ts → stub honesto para todo provider do catálogo
                                     (`domain/integrations/providers.ts`) ainda "preparado,
                                     porém sem implementação funcional"
```

Toda a aplicação passa a falar com qualquer integração exclusivamente
através de `getIntegrationProvider(provider)`. Nenhum módulo (CRM,
Analytics, Marketing Intelligence, IA, Central de Operações) chama uma API
externa diretamente — todos leem dados que o provider já sincronizou nas
próprias tabelas (`meta_*`, Fase 29) ou nas tabelas genéricas
(`public.integrations`, `public.integration_logs`, Fase 6).

**Nenhuma migration nova.** A "infraestrutura reutilizável de sincronização"
pedida pelo briefing (fila, retry, backoff, logs, health) já existia desde
a Fase 6 (`public.integrations` + `public.integration_logs`) — só nunca
tinha sido escrita pelo Meta Ads. Em vez de criar uma tabela genérica
paralela (arriscando duplicar o que já funciona), o Meta Ads passou a
**escrever** nessas duas tabelas a cada job processado, tornando-as
finalmente reais para qualquer tela que já as lia. Isso também elimina o
risco de migrar a fila de produção (`meta_sync_jobs`) que já está em uso.

## O que mudou no Meta Ads (sem reescrever regra nenhuma)

`services/metaAds/metaAdsSyncService.ts::processSyncJob` — o único ponto
que processa um job tanto do cron quanto do "Sincronizar agora" manual —
ganhou uma chamada adicional (`reflectJobOutcomeOnIntegration`) que
espelha o resultado em `public.integrations` (status/saúde/última
sincronização/erro) e grava uma linha em `integration_logs`. Uma falha
isolada (ainda dentro do orçamento de retry) não muda o status para "erro"
no card — só uma falha que já esgotou as 5 tentativas do backoff existente
faz isso, mesmo critério que `setMetaAccountStatus` já usava internamente.

`services/metaAds/metaAdsOAuthService.ts::handleOAuthCallback` — ao
conectar com sucesso, também marca `public.integrations` como "conectado"
e registra `conexao_criada`. **Antes desta fase, a linha `meta_ads_manager`
em `public.integrations` nunca era atualizada por nenhum código** — ficava
para sempre com o valor default da migration da Fase 29, então o card na
Central de Integrações mentia (mostrava "desconectado"/saúde nula mesmo
com uma conta real conectada e sincronizando havia meses). Esse é o bug de
fundo que esta fase resolve, não só uma reorganização de código.

## Central de Integrações (card + Drawer)

Novas ações genéricas, disponíveis para qualquer provider implementado:

- **Sincronizar agora** — `SyncNowButton` no card e no Drawer, chama
  `syncIntegrationNowAction` → `getIntegrationProvider(provider).syncNow()`.
  Para o Meta Ads, reaproveita exatamente `enqueueManualSync` +
  `processSyncJob` — o mesmo par de chamadas que
  `triggerManualSyncAction` (a ação já existente em `/meta-ads/
  configurações`) já usava.
- **Desconectar** — `DisconnectButton`, só aparece no Drawer quando o
  status é "conectado"; chama `disconnectMetaAdsAccount` (Fase 29) e
  atualiza a linha genérica.
- **Status/Saúde/Fila/Tempo médio/Expiração do token** — novos campos no
  Drawer, vindos de `IntegrationDetail.liveStatus`
  (`fetchIntegrationDetail` agora também chama
  `getIntegrationProvider(provider).getStatus()` quando implementado).

`connectionTestService.ts::testIntegrationConnection` perdeu o branch
`if (provider === "meta_ads_manager")` — agora despacha para
`getIntegrationProvider(provider).testConnection()`, igual a qualquer
provider futuro. O branch `meta_ads` (Pixel, Fase 9) foi mantido intocado
— é uma integração distinta (testa Pixel ID + Access Token, não uma conta
OAuth) e nunca fez parte deste padrão.

## Marketing Intelligence

`/marketing/executivo` ganhou um painel "Meta Ads" (`MetaAdsSyncedPanel`)
com investimento/cliques/conversões/campanhas ativas, reaproveitando
`application/metaAds/metaAdsQueries.ts::fetchMetaAdsDashboardData` — a
mesma query que Analytics já chamava, nenhuma consulta nova. Deliberadamente
**não** foi somado ao "Investimento Total" existente
(`application/marketingAnalytics/spend.ts`, dado manual): misturar gasto
real sincronizado com investimento digitado manualmente mudaria o cálculo
de ROAS/CAC já em produção — uma regra de negócio, fora do escopo desta
fase ("apenas disponibilizar os dados", não recalcular métricas
existentes).

## Analytics

Já consumia `fetchMetaAdsDashboardData` desde a Fase 29
(`services/analytics/analyticsMetricsService.ts`) — nada mudou aqui, só
confirmado que continua sendo a mesma função, sem duplicação.

## CRM

`services/metaAds/metaAdsCrmLinkService.ts` (Fase 29) já vincula Conta↔
Cliente/Responsável e Campanha↔Projeto por FK, reaproveitando
`repositories/crm/clientsRepository` e `repositories/projects/
projectsRepository` — verificado e mantido sem alteração.

## IA

`MarketingInsightsInput` (`domain/ai/insights/marketingInsights.ts`) ganhou
um campo `metaAds: MetaAdsDashboardData | null`, populado em
`buildMarketingAssistantContext()` (`services/ai/aiContextService.ts`) com
a mesma query de sempre. Nenhuma sugestão (`buildMarketingInsights`) lê
esse campo ainda — "apenas disponibilização dos dados", como pedido.

## Central de Operações

Nenhuma tela nova. `application/integrations/integrationHealthQueries.ts::
getIntegrationHealthData()` já alimentava o card `integracoes_erro`
(`services/operations/operationsCardsService.ts`) e a linha de módulo
"Integrações" (`services/operations/operationsHealthService.ts`) a partir
de `listIntegrations()` — a mesma tabela genérica que o Meta Ads agora
mantém honesta. Ou seja: o monitoramento pedido pelo briefing já existia
estruturalmente e passou a refletir a realidade só por causa do write-back
descrito acima, sem nenhuma linha de UI nova em Operações.

## Modo Demonstração

- `lib/demo/mockIntegrations.ts`: `meta_ads_manager` foi adicionado a
  `DEMO_CONNECTED` (antes só `meta_ads`/Pixel aparecia conectado no
  catálogo demo, apesar do Meta Ads Manager já ter um dataset demo
  completo desde a Fase 29 — inconsistência corrigida) + 2 novos
  `DEMO_LOG_SEEDS` para o Histórico do Drawer não ficar vazio.
- `syncNow()` em Modo Demonstração retorna uma mensagem de sincronização
  simulada coerente (contas/campanhas do dataset demo existente) sem
  nenhuma escrita no Supabase e nenhuma chamada à Graph API — diferente do
  bloqueio padrão ("ação indisponível em Modo Demonstração") usado por
  `configureIntegrationAction`/`disconnectIntegrationAction`, porque aqui o
  pedido explícito era simular, não bloquear.

## Preparação para próximas integrações

Implementar Google Ads, GA4, Search Console, TikTok Ads, LinkedIn Ads ou
Microsoft Ads de verdade, no futuro, é: escrever um
`services/integrationsCenter/providers/<nome>IntegrationProvider.ts` no
mesmo molde de `metaAdsIntegrationProvider.ts`, e adicionar uma linha em
`REAL_PROVIDER_FACTORIES` (`integrationProviderRegistry.ts`). Nenhum outro
arquivo — card, Drawer, `connectionTestService`, Central de Operações —
precisa mudar.

## Arquivos alterados

```
domain/integrations/provider.ts                              novo — interface IntegrationProvider
domain/integrations/syncBackoff.ts                            novo — relocado de domain/metaAds/
domain/integrations/health.ts                                 novo — computeHealthScore genérico
domain/metaAds/syncBackoff.ts                                 removido (relocado)
services/integrationsCenter/integrationProviderRegistry.ts     novo
services/integrationsCenter/providers/metaAdsIntegrationProvider.ts  novo
services/integrationsCenter/providers/notImplementedProvider.ts      novo
services/integrationsCenter/connectionTestService.ts           dispatch via registry
services/metaAds/metaAdsSyncService.ts                         + reflectJobOutcomeOnIntegration
services/metaAds/metaAdsOAuthService.ts                        + write-back no connect
repositories/metaAds/syncJobsRepository.ts                     + countQueuedJobs
application/integrationsCenter/syncNowAction.ts                novo
application/integrationsCenter/disconnectAction.ts             novo
application/integrations/integrationsActions.ts                + liveStatus/isImplemented
components/integrationsCenter/SyncNowButton.tsx                novo
components/integrationsCenter/DisconnectButton.tsx             novo
components/integrations/IntegrationCard.tsx                    + Sincronizar agora
components/integrations/IntegrationDrawer.tsx                  + Sincronizar/Desconectar/Saúde/Fila/Token
components/marketing/MetaAdsSyncedPanel.tsx                    novo
app/(crm)/(app)/marketing/executivo/page.tsx                   + MetaAdsSyncedPanel
domain/ai/insights/marketingInsights.ts                        + campo metaAds
services/ai/aiContextService.ts                                + fetchMetaAdsDashboardData
domain/integrationsCenter/logEvents.ts                         + 2 labels de evento
lib/demo/mockIntegrations.ts                                   + meta_ads_manager conectado no demo
```

## Validação

- `npm run typecheck` — ✅ sem erros.
- `npm run lint` (Biome) — ✅ sem avisos novos (1 aviso pré-existente e
  não relacionado em `TeamMemberAvatar.tsx`, fora do escopo desta fase).
- `npm run build` — ✅ 108/108 rotas geradas com sucesso — **mesma
  contagem de rotas de antes desta fase**: nenhuma página nova, nenhuma
  removida.
- Revisão manual de cada diff: `processSyncJob`/`handleOAuthCallback`
  mantiveram 100% da lógica original, só ganharam chamadas aditivas no
  final de cada caminho (sucesso e falha).
- OAuth, sincronização, logs, Central de Integrações, Marketing
  Intelligence, Analytics, CRM e Central de Operações verificados por
  leitura de código e pelos tipos (TypeScript fecha o contrato entre
  `IntegrationProvider` e cada consumidor).
- Modo Demonstração verificado por leitura de código (dataset determinístico,
  nenhuma chamada real).
- **Não verificado interativamente no navegador**: o CRM exige sessão
  Supabase Auth real e não há credencial de teste neste ambiente — mesma
  ressalva da Fase 33. Recomenda-se clicar em "Sincronizar agora" e
  "Desconectar" no card do Meta Ads Manager (`/integracoes`) e conferir o
  Drawer após o deploy.
- Nenhum dado de teste foi criado nesta fase (só código de produção e
  seeds do Modo Demonstração, que fazem parte do produto).

## Deploy

Commit `f2a08cd` → push `main` → `vercel --prod` →
**https://brusync.vercel.app**.
