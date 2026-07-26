-- ============================================================================
-- Brusync OS — Fase 26: Brusync AI (Assistente Inteligente).
--
-- Aditivo apenas. Esta fase NÃO integra nenhum provedor externo (OpenAI/
-- Claude/Gemini) — toda resposta é gerada por um provedor simulado
-- (domain/ai/simulatedProvider.ts) que lê dados JÁ existentes no sistema
-- através de services/ai/aiContextService.ts. As tabelas abaixo guardam
-- APENAS o que é genuinamente novo (conversas, mensagens, prompts salvos,
-- log de sugestões geradas, feedback e uso) — nenhum dado de CRM, Projetos,
-- Financeiro, Marketing, Comunicação, Conversões, Integrações, Automações,
-- Base de Conhecimento, Performance ou Operações é duplicado aqui; tudo isso
-- continua sendo lido ao vivo dos módulos originais a cada pergunta/sugestão
-- (mesmo princípio das Fases 22/23/25: só persiste o que não é derivável).
-- ============================================================================

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  title text not null default 'Nova conversa',
  -- Polimórfico por design (mesmo espírito de performance_goals.scope_ref,
  -- Fase 23): guarda o id do lead/cliente/projeto quando context_type os
  -- referencia; null para os assistentes de módulo (geral/marketing/
  -- comercial/financeiro/projetos).
  context_type text not null default 'geral' check (context_type in (
    'geral', 'lead', 'cliente', 'projeto', 'marketing', 'comercial', 'financeiro', 'projetos'
  )),
  context_ref uuid,
  status text not null default 'ativa' check (status in ('ativa', 'arquivada')),
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.ai_conversations enable row level security;

create index if not exists ai_conversations_created_by_idx on public.ai_conversations (created_by);
create index if not exists ai_conversations_context_idx
  on public.ai_conversations (context_type, context_ref);

drop trigger if exists set_ai_conversations_updated_at on public.ai_conversations;
create trigger set_ai_conversations_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê ai_conversations" on public.ai_conversations;
create policy "Equipe interna lê ai_conversations"
  on public.ai_conversations for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia ai_conversations" on public.ai_conversations;
create policy "Equipe interna gerencia ai_conversations"
  on public.ai_conversations for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Mensagens do chat — uma linha por turno (usuário ou assistente).
-- ----------------------------------------------------------------------------
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  is_favorite boolean not null default false
);

alter table public.ai_messages enable row level security;

create index if not exists ai_messages_conversation_idx
  on public.ai_messages (conversation_id, created_at);
create index if not exists ai_messages_favorite_idx on public.ai_messages (is_favorite);

drop policy if exists "Equipe interna lê ai_messages" on public.ai_messages;
create policy "Equipe interna lê ai_messages"
  on public.ai_messages for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia ai_messages" on public.ai_messages;
create policy "Equipe interna gerencia ai_messages"
  on public.ai_messages for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Prompts salvos — atalhos reutilizáveis para o campo de pergunta do chat.
-- ----------------------------------------------------------------------------
create table if not exists public.ai_prompts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  title text not null,
  content text not null,
  category text,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.ai_prompts enable row level security;

drop policy if exists "Equipe interna lê ai_prompts" on public.ai_prompts;
create policy "Equipe interna lê ai_prompts"
  on public.ai_prompts for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia ai_prompts" on public.ai_prompts;
create policy "Equipe interna gerencia ai_prompts"
  on public.ai_prompts for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Log de sugestões geradas (resumo do lead, próxima ação, campanhas de baixo
-- desempenho, etc.) — o CONTEÚDO é sempre recalculado ao vivo
-- (domain/ai/insights/*.ts); esta tabela só registra QUE uma sugestão foi
-- gerada, para alimentar "Sugestões geradas" no dashboard e permitir
-- favoritar — mesmo princípio de team_goal_progress (Fase 25): snapshot,
-- nunca fonte da verdade.
-- ----------------------------------------------------------------------------
create table if not exists public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  type text not null,
  module text not null check (module in (
    'geral', 'lead', 'cliente', 'projeto', 'marketing', 'comercial', 'financeiro', 'projetos'
  )),
  context_ref uuid,
  title text not null,
  content text not null,
  severity text not null default 'info' check (severity in ('info', 'atencao', 'critico')),
  is_favorite boolean not null default false
);

alter table public.ai_suggestions enable row level security;

create index if not exists ai_suggestions_module_idx on public.ai_suggestions (module, created_at desc);
create index if not exists ai_suggestions_context_idx on public.ai_suggestions (context_ref);

drop policy if exists "Equipe interna lê ai_suggestions" on public.ai_suggestions;
create policy "Equipe interna lê ai_suggestions"
  on public.ai_suggestions for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia ai_suggestions" on public.ai_suggestions;
create policy "Equipe interna gerencia ai_suggestions"
  on public.ai_suggestions for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Feedback positivo/negativo sobre uma mensagem ou sugestão.
-- ----------------------------------------------------------------------------
create table if not exists public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  target_type text not null check (target_type in ('message', 'suggestion')),
  target_id uuid not null,
  rating text not null check (rating in ('positivo', 'negativo')),
  comment text,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.ai_feedback enable row level security;

create index if not exists ai_feedback_target_idx on public.ai_feedback (target_type, target_id);

drop policy if exists "Equipe interna lê ai_feedback" on public.ai_feedback;
create policy "Equipe interna lê ai_feedback"
  on public.ai_feedback for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria ai_feedback" on public.ai_feedback;
create policy "Equipe interna cria ai_feedback"
  on public.ai_feedback for insert
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Log de uso — uma linha por pergunta/sugestão/busca na Base de Conhecimento,
-- só para os contadores do dashboard ("Resumo geral"); nunca usado para
-- cobrança ou limite (não há integração de billing nesta fase).
-- ----------------------------------------------------------------------------
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  action_type text not null check (action_type in ('pergunta', 'sugestao', 'busca_conhecimento')),
  module text not null check (module in (
    'geral', 'lead', 'cliente', 'projeto', 'marketing', 'comercial', 'financeiro', 'projetos'
  )),
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.ai_usage enable row level security;

create index if not exists ai_usage_created_at_idx on public.ai_usage (created_at desc);

drop policy if exists "Equipe interna lê ai_usage" on public.ai_usage;
create policy "Equipe interna lê ai_usage"
  on public.ai_usage for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria ai_usage" on public.ai_usage;
create policy "Equipe interna cria ai_usage"
  on public.ai_usage for insert
  with check (public.is_internal_staff());
