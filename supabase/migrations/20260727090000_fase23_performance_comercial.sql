-- ============================================================================
-- Brusync OS — Fase 23: Performance Comercial (Metas, OKRs e Scorecards).
--
-- Aditivo apenas. Ao contrário da Fase 22 (Revenue Intelligence, 100%
-- computado, zero tabela nova), esta fase precisa guardar UM dado que não
-- existe em lugar nenhum do sistema: a própria META (valor-alvo definido por
-- uma pessoa, por tipo/escopo/período). Isso é dado de entrada, não algo
-- derivável do que já existe — por isso, e só por isso, uma tabela nova.
--
-- Tudo o mais (valor realizado, % concluído, ranking, scorecard,
-- comparativos, alertas) é computado on-the-fly a cada carregamento,
-- reaproveitando os serviços já existentes de CRM, Marketing, Financeiro,
-- Agenda, Projetos, Conversões e Revenue Intelligence — nenhum histórico ou
-- alerta é persistido de novo aqui (mesmo princípio já usado na Fase 22: o
-- valor realizado de um período fechado é sempre re-derivável rodando as
-- mesmas funções com o range de datas daquele período).
--
-- "Equipe" (scope_type = 'equipe') não corresponde a uma tabela de times —
-- não existe esse conceito no schema (confirmado: sem team_id/department em
-- profiles, sem tabela teams/squads). scope_ref, nesse caso, guarda o valor
-- de profiles.role (administrador/gestor/comercial/atendimento) — o único
-- eixo de agrupamento de equipe que já existe.
-- ============================================================================

create table if not exists public.performance_goals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  type text not null check (type in (
    'receita', 'leads', 'leads_qualificados', 'reunioes', 'propostas', 'vendas',
    'conversao', 'ticket_medio', 'cac', 'roi', 'roas', 'tempo_resposta',
    'tempo_primeiro_contato', 'tempo_fechamento', 'projetos_concluidos',
    'receitas_recebidas', 'parcelas_atraso'
  )),

  scope_type text not null check (scope_type in (
    'empresa', 'equipe', 'usuario', 'campanha', 'canal', 'cidade', 'origem',
    'pipeline', 'projeto'
  )),
  -- Polimórfico por design (mesmo espírito de operations_favorites.entity_id,
  -- Fase 20): role para 'equipe', id de profiles para 'usuario', campaign
  -- key/utm_medium/cidade/origin/stage key/id de projeto para as demais;
  -- null quando scope_type = 'empresa'.
  scope_ref text,

  period_type text not null check (period_type in (
    'diario', 'semanal', 'mensal', 'trimestral', 'semestral', 'anual', 'personalizado'
  )),
  period_start date not null,
  period_end date not null,
  target_value numeric(14, 2) not null,
  -- Nem toda meta é "quanto maior melhor" — tempo de resposta, tempo até
  -- contato, tempo de fechamento, parcelas em atraso e CAC são "quanto menor
  -- melhor". Mesma necessidade que já levou domain/intelligence/trends.ts a
  -- ter um campo de polaridade ("favorable") para decidir corretamente o
  -- que é uma boa notícia.
  direction text not null default 'maior_melhor' check (direction in ('maior_melhor', 'menor_melhor')),
  status text not null default 'ativa' check (status in ('ativa', 'arquivada')),
  notes text,

  created_by uuid references public.profiles (id) on delete set null
);

alter table public.performance_goals enable row level security;

create index if not exists performance_goals_type_scope_idx
  on public.performance_goals (type, scope_type, scope_ref);
create index if not exists performance_goals_period_idx
  on public.performance_goals (period_start, period_end);
create index if not exists performance_goals_status_idx on public.performance_goals (status);

drop trigger if exists set_performance_goals_updated_at on public.performance_goals;
create trigger set_performance_goals_updated_at
  before update on public.performance_goals
  for each row execute function public.set_updated_at();

-- Metas são visíveis para toda a equipe interna (um gestor precisa ver a
-- meta de um vendedor, um vendedor precisa ver a meta da própria equipe) —
-- mesmo padrão "Equipe interna" já usado em toda tabela de leitura
-- compartilhada (Fase 19), diferente do padrão "Usuário" da Fase 20 (que é
-- para preferência pessoal de UI, não dado de negócio compartilhado.
drop policy if exists "Equipe interna lê performance_goals" on public.performance_goals;
create policy "Equipe interna lê performance_goals"
  on public.performance_goals for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria performance_goals" on public.performance_goals;
create policy "Equipe interna cria performance_goals"
  on public.performance_goals for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza performance_goals" on public.performance_goals;
create policy "Equipe interna atualiza performance_goals"
  on public.performance_goals for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga performance_goals" on public.performance_goals;
create policy "Equipe interna apaga performance_goals"
  on public.performance_goals for delete
  using (public.is_internal_staff());
