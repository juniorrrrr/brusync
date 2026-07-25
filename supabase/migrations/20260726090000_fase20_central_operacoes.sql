-- ============================================================================
-- Brusync OS — Fase 20: Central de Operações (Mission Control).
--
-- Aditivo apenas — nenhuma tabela existente é alterada. Esta fase é
-- deliberadamente a que menos tabelas cria de todo o Brusync: ela é uma
-- camada de AGREGAÇÃO. Cards, Feed, Timeline, Minha Fila, Próximas Ações e
-- Saúde da Operação são todos computados on-the-fly a partir das camadas de
-- aplicação/repositório que CRM, Marketing, Financeiro, Projetos, Agenda,
-- Comunicação, Integrações, Automação, Conversões e Base de Conhecimento já
-- expõem (ver services/operations) — nenhuma dessas informações é
-- persistida de novo aqui. O Feed/Timeline global lê o outbox
-- `integration_events` (Fase 6, services/eventBus) diretamente, exatamente
-- como o comentário original desse arquivo já previa ("um futuro
-- dispatcher... lendo linhas pendentes — o CRM que publica aqui nunca
-- precisa mudar para isso").
--
-- As duas únicas coisas genuinamente NOVAS que a Central de Operações
-- introduz — personalização por usuário — são o que estas duas tabelas
-- guardam:
--   operations_layouts   → o layout pessoal de widgets de um usuário
--                          (quais estão visíveis, em que ordem) — uma linha
--                          por usuário, nunca uma tabela de "widgets"
--                          separada por linha (o layout inteiro é um
--                          conjunto coeso, salvo/lido de uma vez).
--   operations_favorites → favoritos do usuário sobre qualquer tipo de
--                          entidade (lead, cliente, projeto, documento,
--                          dashboard, integração) — mesmo padrão de
--                          crm_knowledge_favorites (Fase 18): por usuário,
--                          nunca compartilhado.
-- ============================================================================

create table if not exists public.operations_layouts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  user_id uuid not null references public.profiles (id) on delete cascade,
  layout jsonb not null default '[]'::jsonb
);

alter table public.operations_layouts enable row level security;

create unique index if not exists operations_layouts_user_idx on public.operations_layouts (user_id);

drop trigger if exists set_operations_layouts_updated_at on public.operations_layouts;
create trigger set_operations_layouts_updated_at
  before update on public.operations_layouts
  for each row execute function public.set_updated_at();

drop policy if exists "Usuário lê o próprio layout" on public.operations_layouts;
create policy "Usuário lê o próprio layout"
  on public.operations_layouts for select
  using (public.is_internal_staff() and user_id = auth.uid());
drop policy if exists "Usuário cria o próprio layout" on public.operations_layouts;
create policy "Usuário cria o próprio layout"
  on public.operations_layouts for insert
  with check (public.is_internal_staff() and user_id = auth.uid());
drop policy if exists "Usuário atualiza o próprio layout" on public.operations_layouts;
create policy "Usuário atualiza o próprio layout"
  on public.operations_layouts for update
  using (public.is_internal_staff() and user_id = auth.uid())
  with check (public.is_internal_staff() and user_id = auth.uid());
drop policy if exists "Usuário apaga o próprio layout" on public.operations_layouts;
create policy "Usuário apaga o próprio layout"
  on public.operations_layouts for delete
  using (public.is_internal_staff() and user_id = auth.uid());

-- ----------------------------------------------------------------------------
create table if not exists public.operations_favorites (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  user_id uuid not null references public.profiles (id) on delete cascade,
  entity_type text not null
    check (entity_type in ('lead', 'client', 'project', 'document', 'dashboard', 'integration')),
  entity_id text not null,
  label text not null,
  href text
);

alter table public.operations_favorites enable row level security;

create unique index if not exists operations_favorites_unique_idx
  on public.operations_favorites (user_id, entity_type, entity_id);
create index if not exists operations_favorites_user_idx on public.operations_favorites (user_id);

drop policy if exists "Usuário lê os próprios favoritos" on public.operations_favorites;
create policy "Usuário lê os próprios favoritos"
  on public.operations_favorites for select
  using (public.is_internal_staff() and user_id = auth.uid());
drop policy if exists "Usuário cria os próprios favoritos" on public.operations_favorites;
create policy "Usuário cria os próprios favoritos"
  on public.operations_favorites for insert
  with check (public.is_internal_staff() and user_id = auth.uid());
drop policy if exists "Usuário apaga os próprios favoritos" on public.operations_favorites;
create policy "Usuário apaga os próprios favoritos"
  on public.operations_favorites for delete
  using (public.is_internal_staff() and user_id = auth.uid());
