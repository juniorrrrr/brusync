-- ============================================================================
-- Brusync OS — Fase 25: Gestão de Equipe (People OS).
--
-- Painel operacional da equipe interna, não um módulo de RH. Reaproveita
-- profiles (id, name, email, role de acesso) tal qual — nunca duplica esses
-- campos — e só guarda o que não existe em nenhuma tabela hoje: os atributos
-- de "perfil de colaborador" (foto, cargo, departamento, data de entrada,
-- status operacional, contato, supervisor) e os artefatos de People Ops que
-- nenhum outro módulo modela (metas por colaborador, feedback interno,
-- check-ins, ausências, notificações).
--
-- Os indicadores "por responsável" do dashboard (Leads/Clientes/Projetos/
-- Receita/Conversão) são sempre computados on-the-fly a partir de CRM,
-- Projetos e Financeiro — mesmo princípio já usado pela Fase 23 (Performance
-- Comercial): nenhum histórico de leads/clientes/projetos/receita é
-- persistido de novo aqui.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Catálogo de cargos/papéis organizacionais — distinto de profiles.role (que
-- é o papel de ACESSO/permissão: administrador/gestor/comercial/atendimento/
-- cliente). "Cargo" aqui é descritivo (ex.: "SDR", "Closer", "Analista de
-- Marketing"), livre de qualquer regra de permissão.
-- ----------------------------------------------------------------------------
create table if not exists public.team_roles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null unique,
  department text,
  description text
);

alter table public.team_roles enable row level security;

drop policy if exists "Equipe interna lê team_roles" on public.team_roles;
create policy "Equipe interna lê team_roles"
  on public.team_roles for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia team_roles" on public.team_roles;
create policy "Equipe interna gerencia team_roles"
  on public.team_roles for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Extensão 1:1 de profiles — uma linha por colaborador interno com atributos
-- de People Ops que profiles não tem.
-- ----------------------------------------------------------------------------
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  photo_url text,
  role_id uuid references public.team_roles (id) on delete set null,
  department text,
  entry_date date,
  status text not null default 'ativo' check (status in ('ativo', 'ferias', 'afastado', 'inativo')),
  phone text,
  supervisor_id uuid references public.team_members (id) on delete set null,
  notes text
);

alter table public.team_members enable row level security;

create index if not exists team_members_status_idx on public.team_members (status);
create index if not exists team_members_supervisor_idx on public.team_members (supervisor_id);

drop trigger if exists set_team_members_updated_at on public.team_members;
create trigger set_team_members_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê team_members" on public.team_members;
create policy "Equipe interna lê team_members"
  on public.team_members for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia team_members" on public.team_members;
create policy "Equipe interna gerencia team_members"
  on public.team_members for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Metas por colaborador — dado de entrada (valor-alvo definido por uma
-- pessoa), mesmo princípio de performance_goals (Fase 23): não é derivável do
-- que já existe, por isso é a única tabela desta fase que guarda um "alvo".
-- ----------------------------------------------------------------------------
create table if not exists public.team_goals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  team_member_id uuid not null references public.team_members (id) on delete cascade,
  type text not null check (type in (
    'receita', 'leads', 'conversao', 'projetos', 'clientes', 'atividades', 'tempo_resposta'
  )),
  period_type text not null check (period_type in ('mensal', 'trimestral', 'anual')),
  period_start date not null,
  period_end date not null,
  target_value numeric(14, 2) not null,
  direction text not null default 'maior_melhor' check (direction in ('maior_melhor', 'menor_melhor')),
  status text not null default 'ativa' check (status in ('ativa', 'arquivada')),
  notes text,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.team_goals enable row level security;

create index if not exists team_goals_member_idx on public.team_goals (team_member_id);
create index if not exists team_goals_period_idx on public.team_goals (period_start, period_end);
create index if not exists team_goals_status_idx on public.team_goals (status);

drop trigger if exists set_team_goals_updated_at on public.team_goals;
create trigger set_team_goals_updated_at
  before update on public.team_goals
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê team_goals" on public.team_goals;
create policy "Equipe interna lê team_goals"
  on public.team_goals for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia team_goals" on public.team_goals;
create policy "Equipe interna gerencia team_goals"
  on public.team_goals for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Histórico de progresso de uma meta — snapshot leve gravado a cada
-- recálculo (dashboard/individual), o que dá um sparkline sem precisar
-- reconstruir o valor realizado de datas passadas.
-- ----------------------------------------------------------------------------
create table if not exists public.team_goal_progress (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  goal_id uuid not null references public.team_goals (id) on delete cascade,
  recorded_at timestamptz not null default now(),
  actual_value numeric(14, 2),
  percent_complete numeric(6, 2),
  note text,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.team_goal_progress enable row level security;

create index if not exists team_goal_progress_goal_idx
  on public.team_goal_progress (goal_id, recorded_at desc);

drop policy if exists "Equipe interna lê team_goal_progress" on public.team_goal_progress;
create policy "Equipe interna lê team_goal_progress"
  on public.team_goal_progress for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria team_goal_progress" on public.team_goal_progress;
create policy "Equipe interna cria team_goal_progress"
  on public.team_goal_progress for insert
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Feedback interno — simples por design (autor, destinatário, tipo,
-- comentário, status), sem workflow de aprovação.
-- ----------------------------------------------------------------------------
create table if not exists public.team_feedbacks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  author_id uuid references public.profiles (id) on delete set null,
  recipient_team_member_id uuid not null references public.team_members (id) on delete cascade,
  type text not null check (type in ('elogio', 'construtivo', 'alerta', 'reconhecimento')),
  comment text not null,
  status text not null default 'aberto' check (status in ('aberto', 'reconhecido', 'arquivado'))
);

alter table public.team_feedbacks enable row level security;

create index if not exists team_feedbacks_recipient_idx
  on public.team_feedbacks (recipient_team_member_id, created_at desc);

drop trigger if exists set_team_feedbacks_updated_at on public.team_feedbacks;
create trigger set_team_feedbacks_updated_at
  before update on public.team_feedbacks
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê team_feedbacks" on public.team_feedbacks;
create policy "Equipe interna lê team_feedbacks"
  on public.team_feedbacks for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia team_feedbacks" on public.team_feedbacks;
create policy "Equipe interna gerencia team_feedbacks"
  on public.team_feedbacks for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Check-ins — 1:1, reuniões, avaliações, alinhamentos.
-- ----------------------------------------------------------------------------
create table if not exists public.team_checkins (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  team_member_id uuid not null references public.team_members (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  type text not null check (type in ('1_1', 'reuniao', 'avaliacao', 'alinhamento')),
  scheduled_at timestamptz not null,
  notes text,
  status text not null default 'agendado' check (status in ('agendado', 'realizado', 'cancelado'))
);

alter table public.team_checkins enable row level security;

create index if not exists team_checkins_member_idx
  on public.team_checkins (team_member_id, scheduled_at desc);

drop trigger if exists set_team_checkins_updated_at on public.team_checkins;
create trigger set_team_checkins_updated_at
  before update on public.team_checkins
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê team_checkins" on public.team_checkins;
create policy "Equipe interna lê team_checkins"
  on public.team_checkins for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia team_checkins" on public.team_checkins;
create policy "Equipe interna gerencia team_checkins"
  on public.team_checkins for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Ausências (férias, licenças, folgas, atestados).
-- ----------------------------------------------------------------------------
create table if not exists public.team_time_off (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  team_member_id uuid not null references public.team_members (id) on delete cascade,
  type text not null check (type in ('ferias', 'licenca', 'folga', 'atestado')),
  start_date date not null,
  end_date date not null,
  status text not null default 'solicitado'
    check (status in ('solicitado', 'aprovado', 'rejeitado', 'concluido')),
  notes text
);

alter table public.team_time_off enable row level security;

create index if not exists team_time_off_member_idx
  on public.team_time_off (team_member_id, start_date desc);

drop policy if exists "Equipe interna lê team_time_off" on public.team_time_off;
create policy "Equipe interna lê team_time_off"
  on public.team_time_off for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia team_time_off" on public.team_time_off;
create policy "Equipe interna gerencia team_time_off"
  on public.team_time_off for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Notificações internas do módulo (meta batida, feedback recebido, check-in
-- agendado, ausência aprovada, avisos do sistema). team_member_id nulo =
-- notificação global (broadcast para toda a equipe).
-- ----------------------------------------------------------------------------
create table if not exists public.team_notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  team_member_id uuid references public.team_members (id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in ('meta', 'feedback', 'checkin', 'time_off', 'sistema')),
  read_at timestamptz
);

alter table public.team_notifications enable row level security;

create index if not exists team_notifications_member_idx
  on public.team_notifications (team_member_id, created_at desc);

drop policy if exists "Equipe interna lê team_notifications" on public.team_notifications;
create policy "Equipe interna lê team_notifications"
  on public.team_notifications for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna gerencia team_notifications" on public.team_notifications;
create policy "Equipe interna gerencia team_notifications"
  on public.team_notifications for all
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
