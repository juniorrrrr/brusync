# Fase 33 — Consolidação da Experiência (Information Architecture & UX)

Data: 2026-07-26
Escopo: reorganização da navegação do Brusync OS (sidebar, header,
Dashboard, hubs de Inteligência). Nenhuma rota, regra de negócio ou tabela
do banco foi alterada.

---

## Decisão de arquitetura mais importante

A IA da sidebar vivia inteiramente em um único array (`CRM_NAV` em
`lib/crm/navigation.tsx`), consumido só por `components/layout/Sidebar.tsx`.
Isso tornou a Fase 33 uma mudança de **dado central + comportamento de
apresentação**, não uma migração de rotas: os `href` de cada item
continuam exatamente os mesmos de antes — só a forma como são agrupados e
revelados mudou. Por isso não foram necessários redirects nem alteração em
nenhuma página (`app/(crm)/(app)/**`) além do Dashboard e dos 5 layouts de
Inteligência.

`getActiveGroupId(pathname)` e `getBreadcrumb(pathname)` (novas funções
puras em `lib/crm/navigation.tsx`) derivam tudo a partir do mesmo array —
sidebar e header nunca podem divergir sobre qual módulo está ativo.

## O que mudou

### Sidebar → accordion (`components/layout/Sidebar.tsx`, `types/crm.ts`)

`NavSection` virou `NavGroup` (`id`, `icon`, `standalone?`). `CRM_NAV`
agora tem 6 grupos:

```
Dashboard        (standalone, sem cabeçalho de grupo)
CRM              → Leads, Pipeline, Clientes
Comunicação      → Agenda, Caixa de Entrada (/comunicacao), WhatsApp
Operações        → Projetos, Playbooks, Processos, Base de Conhecimento, Materiais, Equipe, Financeiro
Inteligência     → Analytics, Marketing Intelligence, Meta Ads, Revenue Intelligence, Performance, Conversões, Central de Inteligência, Automações, IA
Sistema          → Central de Operações, Integrações, Configurações, Usuários, Permissões
```

Apenas um grupo fica expandido por vez. Ao carregar, o grupo do módulo
ativo abre automaticamente; a escolha manual do usuário persiste em
`localStorage` (`brusync:sidebar:open-group`) e é sobrescrita sempre que a
navegação muda de módulo (ex: via busca global). O cabeçalho do grupo
recebe destaque visual (`--accent`) quando contém a rota ativa, mesmo
colapsado.

Nenhum item foi removido — "Central de Inteligência", "Automações" e
"Base de Conhecimento" (que não apareciam como bullets explícitos no
briefing da fase) foram preservados dentro do grupo mais próximo
semanticamente (Inteligência e Operações, respectivamente), como pedido
("nenhuma funcionalidade poderá ser perdida").

### Header → breadcrumb central (`components/layout/Header.tsx`)

O header já tinha uma classe `.crm-header-crumb` no CSS, definida mas
nunca usada em nenhum `.tsx`. `getBreadcrumb()` agora a alimenta:
título da página vira o item ativo (ex: "Analytics"), e a linha abaixo
mostra o grupo (ex: "Inteligência") — sem editar título nenhuma das ~50
páginas individuais, já que é derivado do pathname centralmente.

### Dashboard → porta de entrada (`components/dashboard/QuickShortcuts.tsx`)

Atalhos para CRM (`/pipeline`), Projetos, Agenda, Financeiro, Analytics e
WhatsApp, no topo do Dashboard, acima dos KPIs.

### Analytics → hub central (`components/intelligence/IntelligenceHubNav.tsx`)

As 5 telas de Inteligência (Analytics, Marketing Intelligence, Revenue
Intelligence, Performance, Conversões) ganharam uma barra de navegação
compartilhada entre si, no mesmo padrão visual (`role="tablist"`, `<Link>`
real) já usado pelas SubNavs internas de cada uma (`MarketingSubNav`,
`RevenueSubNav`, `PerformanceSubNav`) — sem duplicar componente, só um
novo nível acima delas. Cada hub mantém sua própria SubNav de abas
internas abaixo disso.

### Comunicação

"Central de Comunicação" (rota `/comunicacao`, já era um inbox unificado
funcional desde a Fase 15) foi renomeada para **"Caixa de Entrada"** só no
label do menu — preparando a nomenclatura para os canais futuros
(Instagram, Messenger, Email) sem tocar em `page.tsx`/`layout.tsx`/schema.

## Arquivos alterados

```
types/crm.ts                                    NavSection → NavGroup
lib/crm/navigation.tsx                           CRM_NAV reagrupado + getActiveGroupId + getBreadcrumb
components/layout/Sidebar.tsx                    accordion + localStorage
components/layout/Header.tsx                     breadcrumb
styles/crm.css                                   .crm-nav-group-*, .crm-dash-shortcuts (crm-header-crumb já existia)
components/dashboard/QuickShortcuts.tsx          novo
components/intelligence/IntelligenceHubNav.tsx   novo
app/(crm)/(app)/dashboard/page.tsx               + QuickShortcuts
app/(crm)/(app)/analytics/layout.tsx             + IntelligenceHubNav
app/(crm)/(app)/marketing/layout.tsx             + IntelligenceHubNav
app/(crm)/(app)/receita/layout.tsx               + IntelligenceHubNav
app/(crm)/(app)/performance/layout.tsx           + IntelligenceHubNav
app/(crm)/(app)/conversoes/layout.tsx            + IntelligenceHubNav
```

## Compatibilidade

Nenhum `href` mudou — todas as 108 rotas geradas no build continuam nos
mesmos caminhos. Nenhum redirect foi necessário. Modo Demonstração não foi
tocado (nenhuma query, service ou cookie de demo foi alterado).

## Validação

- `npm run typecheck` — ✅ sem erros.
- `npm run lint` (Biome) — ✅ sem avisos novos (1 aviso pré-existente e
  não relacionado em `TeamMemberAvatar.tsx`, fora do escopo desta fase).
- `npm run build` — ✅ 108/108 rotas geradas com sucesso, nenhuma rota
  removida ou renomeada.
- Revisão manual, rota a rota, do casamento `pathname` → grupo/breadcrumb
  em `getActiveGroupId`/`getBreadcrumb` para todas as ~50 páginas do app
  (incluindo subrotas dinâmicas como `/playbooks/[id]`,
  `/base-conhecimento/documentos/[id]/editar`).
- Responsividade: CSS do accordion e dos atalhos do Dashboard usa as
  mesmas media queries (`max-width: 1020px` sidebar, `900px`/`520px`
  atalhos) já validadas no restante do `crm.css`; comportamento mobile do
  sidebar (`transform`/`scrim`) não foi alterado, só o conteúdo interno.
- **Não verificado interativamente no navegador**: as rotas do CRM exigem
  sessão Supabase Auth real e não há credencial de teste neste ambiente.
  Recomenda-se um clique manual rápido pelo usuário (accordion abrindo/
  fechando, atalhos do Dashboard, hub de Inteligência) após o deploy.

## Deploy

Commit `150033d` → push `main` → `vercel --prod` →
**https://brusync.vercel.app** (READY).
