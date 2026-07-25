# Fase 21 — Auditoria de Segurança, Arquitetura e Cybersecurity

Data: 2026-07-24
Escopo: CRM, Pipeline, Agenda, Projetos, Financeiro, Marketing Intelligence,
Conversões, Comunicação, Integrações, Automações, Portal do Cliente, Base de
Conhecimento, Central de Inteligência, Central de Operações, Login, Landing
Page, APIs, Supabase, Storage, Vercel, Banco de Dados, Event Bus, Conversion
Hub, Meta Conversions API, Modo Demonstração.

Metodologia: reconhecimento em paralelo por área (segurança/auth, banco de
dados/integrações/event bus, código/performance/storage), seguido de
verificação manual linha a linha de cada achado antes de classificar como
"corrigir" ou "documentar". Nenhuma funcionalidade nova foi criada, nenhuma
regra de negócio foi alterada, nenhum código foi refatorado por preferência
estética.

---

## CRÍTICO

### 1. RLS de `profiles` impedia a equipe de ver perfis de colegas
- **Módulo**: Banco de Dados / CRM / Base de Conhecimento
- **Problema**: a tabela `profiles` só tinha 2 policies de `select`: leitura
  do próprio perfil (`auth.uid() = id`) e uma policy específica do Portal do
  Cliente (equipe vista através de um projeto do próprio cliente). Não havia
  nenhuma policy "equipe interna lê perfis de outros membros da equipe".
- **Impacto**: sob RLS, qualquer usuário da equipe só enxergava a própria
  linha. Dois recursos reais quebravam silenciosamente (sem erro — apenas
  resultado vazio/incompleto):
  - `listOwnerOptions()` (`repositories/crm/leadsRepository.ts`), que alimenta
    os seletores de "Responsável" em Leads e Clientes — só listava o próprio
    usuário logado, nunca os colegas;
  - a dimensão "autor" da busca global da Base de Conhecimento
    (`services/knowledge/knowledgeSearchService.ts`) — nunca encontrava
    documentos de outro autor.
- **Risco**: funcional/operacional (não é uma falha de exposição de dados —
  é o oposto, dados de mais restritos do que deveriam), mas classificado como
  crítico porque afeta um fluxo central do CRM em produção.
- **Solução aplicada**: nova migration
  `supabase/migrations/20260726100000_fase21_auditoria_seguranca.sql`
  adicionando `create policy "Equipe interna lê profiles da equipe" on
  public.profiles for select using (public.is_internal_staff());` — mesmo
  padrão já usado em todas as outras tabelas "Equipe interna lê X".
  **Pendente de aplicação**: o CLI do Supabase está autenticado com uma conta
  sem acesso à organização do projeto BRUSYNC (`db push` retornou 403), então
  a migration está no repositório mas ainda não foi empurrada para o banco.
  Ação necessária: rodar `supabase db push` autenticado na conta correta (ou
  colar o SQL da migration no SQL Editor do projeto `angigrgwfswidoebmjdl` no
  painel do Supabase).

---

## ALTO

### 2. Dados pessoais completos em log de diagnóstico
- **Módulo**: Landing Page / Formulário de Contato
- **Problema**: `services/leads.ts` tinha uma função de diagnóstico temporário
  (`logSupabaseIssue`, comentário "DIAGNÓSTICO TEMPORÁRIO — remover após
  identificar a causa da regressão") que logava no `console.error` o payload
  completo do lead — nome, e-mail, empresa, telefone, mensagem, IP — em
  qualquer falha de checagem de rate-limit ou de insert.
- **Impacto**: dados pessoais de visitantes do site público em texto puro nos
  logs do servidor (Vercel).
- **Risco**: LGPD — dados pessoais não devem aparecer em log.
- **Solução aplicada**: `logSupabaseIssue` agora passa por `redactForLog()`
  antes de logar — mantém a estrutura de diagnóstico (status, erro, chaves
  presentes) mas substitui os valores de `payload`/`name`/`email`/`company`/
  `phone`/`message`/`ip_address` por `<redacted>`. O diagnóstico continua útil
  para investigar falhas de infraestrutura, sem expor os dados do lead.

### 3. Upload de arquivo sem validação de tipo MIME em 4 fluxos
- **Módulo**: Financeiro, Projetos, Portal do Cliente, Base de Conhecimento
- **Problema**: `financialDocumentsActions.ts`, `projectFilesActions.ts`,
  `portalFilesActions.ts` e `knowledgeFilesActions.ts` validavam apenas o
  tamanho do arquivo — nenhum validava `file.type` contra uma allowlist,
  diferente do fluxo de arquivos de Lead (`schemas/crm/file.schema.ts`, que já
  tinha `ALLOWED_LEAD_FILE_MIME_TYPES`).
- **Impacto**: qualquer tipo de arquivo podia ser enviado para os buckets
  privados do Storage (ex. HTML/SVG, que podem executar script se abertos
  inline por uma signed URL).
- **Risco**: upload irrestrito de arquivo / risco de conteúdo malicioso
  armazenado.
- **Solução aplicada**: extraída a allowlist/validador para
  `schemas/shared/fileValidation.ts` (`ALLOWED_DOCUMENT_MIME_TYPES`,
  `validateDocumentFile`), reaproveitado por `schemas/crm/file.schema.ts` e
  aplicado nos 4 pontos de upload acima — mesmos limites de tamanho já
  existentes (15MB/15MB/15MB/25MB), sem alterar valores, apenas somando a
  checagem de tipo.

---

## MÉDIO

### 4. Cookie `demo_mode` sem `secure`
- **Módulo**: Modo Demonstração
- **Problema**: `application/demo/demoModeActions.ts` setava o cookie apenas
  com `path`, `maxAge`, `sameSite: "lax"`.
- **Impacto/Risco**: baixo — o bloqueio real de escrita em Modo Demonstração
  não depende deste cookie para autorização (é feito no Proxy do client
  Supabase, `services/supabase/authServer.ts`, e checado de novo em cada
  Server Action de escrita), mas o cookie deveria exigir HTTPS em produção.
- **Solução aplicada**: adicionado `secure: process.env.NODE_ENV ===
  "production"`. **Não foi adicionado `httpOnly`**: verificado que
  `components/layout/DemoModeToggle.tsx` lê este cookie via `document.cookie`
  de propósito, para reconciliar com `localStorage` no mount — tornar o
  cookie `httpOnly` quebraria esse recurso (o toggle acionaria uma
  correção/`router.refresh()` desnecessária a cada carregamento de página).

### 5. Gap no `matcher` do `middleware.ts`
- **Módulo**: Login / Autenticação (edge)
- **Problema**: `/agenda`, `/automacoes`, `/base-conhecimento`, `/comunicacao`,
  `/financeiro`, `/inteligencia`, `/marketing`, `/operacoes`, `/projetos` não
  estavam no `config.matcher`, diferente das demais rotas do CRM.
- **Impacto**: nenhum — confirmado que `app/(crm)/(app)/layout.tsx` chama
  `requireUser()` no nível de Server Component para toda a árvore de rotas
  (defesa em profundidade), então essas rotas nunca ficaram desprotegidas.
  Era uma inconsistência (proteção só na camada RSC, mais lenta, em vez de
  também na edge) em vez de uma vulnerabilidade ativa.
- **Risco**: baixo, mas resolvido por consistência e para reduzir a
  superfície que depende só da segunda camada de defesa.
- **Solução aplicada**: adicionados os 9 segmentos faltantes ao `matcher`.

### 6. `.env.example` incompleto
- **Módulo**: Configuração / Deploy
- **Problema**: não documentava `NEXT_PUBLIC_SUPABASE_URL` nem
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, exigidas por
  `services/supabase/authServer.ts` e `authMiddleware.ts` para login/sessão
  funcionarem.
- **Impacto**: risco de um novo ambiente ou deploy esquecer de configurar
  essas variáveis (login pararia de funcionar).
- **Solução aplicada**: variáveis documentadas com comentário explicativo.

### 7. Duas Context providers sem `useMemo` no value
- **Módulo**: Financeiro / Portal do Cliente (performance)
- **Problema**: `FinancialEditorContext` e `PortalMessagesContext` eram as
  únicas 2 de 13 providers do app que não memoizavam o `value` do Provider.
  `FinancialEditorProvider` envolve toda a árvore do app CRM
  (`app/(crm)/(app)/layout.tsx`), então qualquer re-render de um provider
  vizinho recriava o objeto e re-renderizava todo consumidor sem necessidade.
- **Solução aplicada**: `value` envolvido em `useMemo` nos dois arquivos,
  replicando o padrão já usado em `contexts/crm/LeadDrawerContext.tsx` e nos
  outros 11 providers.

---

## BAIXO (documentado — não corrigido nesta fase)

| # | Item | Por que não foi corrigido agora |
|---|------|----------------------------------|
| 8 | Formulário de contato (`services/leads.ts`) não usa Cloudflare Turnstile, só honeypot + tempo mínimo + rate-limit — inconsistente com o formulário de materiais, que usa Turnstile. | Exige adicionar o widget no frontend do formulário público; é uma mudança de UX visível, recomenda-se tratar em um próximo ciclo com validação visual. |
| 9 | Sem rate limiting/lockout de tentativas no login (staff e portal), além do nativo do Supabase Auth. | Nenhuma evidência de abuso hoje; recomenda-se monitorar e só adicionar throttling dedicado se necessário. |
| 10 | `healthScore` da Meta Conversions API é calculado a cada falha, mas nada consome esse valor (sem circuit breaker). | Decisão de produto (quando pausar envios automaticamente) — fora do escopo de "auditoria", é mudança de regra de negócio. |
| 11 | `next/image` nunca é usado no projeto — zero pipeline de otimização de imagem. | Mudança ampla, exigiria revisar cada uso de `<img>` individualmente; risco/esforço desproporcional para esta fase. |
| 12 | Apenas 6 de 53 arquivos de Server Actions/queries em `application/**` usam Zod (`safeParse`/`parse`); o restante valida manualmente campo a campo. | Não há risco de injeção comprovado (100% das queries passam pelo query builder parametrizado do Supabase); é uma inconsistência de padrão, não uma vulnerabilidade — padronizar em massa arriscaria alterar regras de validação por engano. Recomenda-se migrar arquivo a arquivo. |
| 13 | Limites de tamanho de upload duplicados com valores diferentes (15MB/15MB/15MB/25MB) em constantes locais em vez de uma única fonte. | Cosmético — nenhum risco real hoje; consolidar quando esses arquivos forem tocados por outro motivo. |
| 14 | Não existe migration `fase17` (numeração pula de `fase16` para `fase18`). | Tudo indica renumeração intencional de fase de produto, não um "drift" real entre `schema.sql` e as migrations — nenhuma tabela/policy órfã encontrada. |
| 15 | Turnstile falha aberto (pula a verificação) se `TURNSTILE_SECRET_KEY` não estiver definida. | Comportamento intencional e documentado no código (mantém o formulário de materiais funcionando mesmo sem a env var, com honeypot/tempo/rate-limit como camadas de reserva) — não é um bug de código, é uma checagem operacional: confirmar que a variável está de fato configurada na Vercel em produção. |

---

## Verificado e sem problema encontrado

- **RLS**: habilitado em 100% das tabelas (58/58). Isolamento multi-tenant do
  Portal do Cliente (`crm_client_portal_users`, `crm_client_portal_messages`,
  policies de Storage do bucket `crm-project-files`) corretamente restrito por
  `client_id` / `current_portal_client_id()` — um cliente do portal não
  consegue ler dados de outro.
- **Segredos**: nenhum segredo (service role key, chave de criptografia do
  Meta, Turnstile secret, `CRON_SECRET`) é alcançável por componente cliente —
  todos atrás de `import "server-only"`.
- **Meta Conversions API**: Access Token criptografado em repouso
  (AES-256-GCM), nunca logado em texto puro; dados pessoais (e-mail, telefone,
  nome, cidade) sempre hasheados (SHA-256) antes de sair para o Meta.
- **Storage**: todos os buckets são privados; downloads sempre por signed URL
  de curta duração; `getPublicUrl` nunca é usado em nenhum lugar do código.
- **Headers HTTP**: `next.config.ts` já tem CSP, HSTS, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP e CORP
  configurados corretamente para todas as rotas.
- **Qualidade de código**: zero uso de `any`, `@ts-ignore`/`@ts-expect-error`,
  `TODO`/`FIXME` em todo o repositório; `strict: true` no `tsconfig.json`
  genuinamente respeitado.
- **Modo Demonstração**: bloqueado no servidor via Proxy no client Supabase
  (intercepta insert/update/upsert/delete antes de qualquer chamada de rede),
  reforçado por checagem explícita em cada Server Action de escrita — não
  depende só de uma flag de UI.
- **Injeção SQL**: todas as consultas passam pelo query builder parametrizado
  do Supabase/PostgREST; buscas por texto livre usam `sanitizeSearchTerm`
  contra injeção no operador `.or()`.

---

## Validação final

- `npm run typecheck` — ✅ sem erros.
- `npm run lint` (Biome) — ✅ sem avisos (corrigido 1 aviso: comentário
  `eslint-disable` morto em `app/layout.tsx`, substituído pelo equivalente
  `biome-ignore` já usado no resto do projeto para o mesmo caso — pixel de
  rastreamento do Meta em `<noscript>`).
- `npm run build` — ✅ build de produção concluído com sucesso, todas as
  rotas (CRM, Portal, Landing Page, cron jobs) geradas normalmente.

## Ação pendente do usuário

A migration do item CRÍTICO (`20260726100000_fase21_auditoria_seguranca.sql`)
está no repositório mas **não foi aplicada ao banco** — o Supabase CLI local
está autenticado numa conta sem acesso à organização do projeto BRUSYNC.
Rodar `supabase db push` (com a conta/token correto, ou `SUPABASE_DB_PASSWORD`
definida) ou aplicar o SQL diretamente pelo SQL Editor do projeto
`angigrgwfswidoebmjdl` no painel do Supabase.
