-- ============================================================================
-- Brusync OS — Fase 12: Gestão de Projetos.
--
-- Aditivo apenas — nenhuma tabela existente é alterada. Ambiente de
-- implantação de projetos de software/serviços vinculado a public.clients
-- (não um gerenciador de tarefas genérico): um Cliente pode ter vários
-- Projetos, cada Projeto tem etapas configuráveis e cada etapa pode ter
-- tarefas com comentários e arquivos.
--
-- Quatro tabelas, um conceito cada:
--   crm_projects        → o projeto em si, vinculado a um cliente.
--   crm_project_phases  → etapas configuráveis (Diagnóstico, Planejamento,
--                         Desenvolvimento, Integração, Validação, Entrega,
--                         Concluído por padrão — mas editáveis).
--   crm_project_tasks   → tarefas de uma etapa, com comentários embutidos
--                         (jsonb — evitaria uma 5ª tabela só para
--                         comentários, o que o escopo desta fase não pede).
--   crm_project_files   → arquivos do projeto ou de uma tarefa específica
--                         (task_id nulo = arquivo do projeto).
--
-- Não existe tabela de timeline própria: a "Timeline" (do Projeto e do
-- Cliente) é computada a partir dos timestamps já existentes nestas quatro
-- tabelas (criado_em, iniciado_em, concluido_em, enviado_em), nunca uma
-- tabela de log separada — nem crm_lead_activities (estritamente vinculada
-- a um lead) nem uma nova tabela seriam compatíveis com "criar apenas as
-- tabelas necessárias".
-- ============================================================================

create table if not exists public.crm_projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  client_id uuid not null references public.clients (id) on delete cascade,

  name text not null,
  description text,
  status text not null default 'planejamento' check (status in (
    'planejamento', 'em_andamento', 'pausado', 'concluido', 'cancelado'
  )),

  owner_id uuid references public.profiles (id) on delete set null,

  started_at timestamptz,
  due_at timestamptz,
  completed_at timestamptz,

  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_projects enable row level security;

create index if not exists crm_projects_client_idx on public.crm_projects (client_id);
create index if not exists crm_projects_owner_idx on public.crm_projects (owner_id);
create index if not exists crm_projects_status_idx on public.crm_projects (status);
create index if not exists crm_projects_due_idx on public.crm_projects (due_at);

drop trigger if exists set_crm_projects_updated_at on public.crm_projects;
create trigger set_crm_projects_updated_at
  before update on public.crm_projects
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_projects" on public.crm_projects;
create policy "Equipe interna lê crm_projects"
  on public.crm_projects for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_projects" on public.crm_projects;
create policy "Equipe interna cria crm_projects"
  on public.crm_projects for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_projects" on public.crm_projects;
create policy "Equipe interna atualiza crm_projects"
  on public.crm_projects for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_projects" on public.crm_projects;
create policy "Equipe interna apaga crm_projects"
  on public.crm_projects for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Etapas configuráveis. Um conjunto padrão é criado junto com o projeto
-- (Diagnóstico, Planejamento, Desenvolvimento, Integração, Validação,
-- Entrega, Concluído), mas podem ser renomeadas, reordenadas, adicionadas
-- ou removidas — "position" define a ordem.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_project_phases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  project_id uuid not null references public.crm_projects (id) on delete cascade,
  name text not null,
  position integer not null default 0,

  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluido')),
  started_at timestamptz,
  due_at timestamptz,
  completed_at timestamptz
);

alter table public.crm_project_phases enable row level security;

create index if not exists crm_project_phases_project_idx on public.crm_project_phases (project_id, position);

drop trigger if exists set_crm_project_phases_updated_at on public.crm_project_phases;
create trigger set_crm_project_phases_updated_at
  before update on public.crm_project_phases
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_project_phases" on public.crm_project_phases;
create policy "Equipe interna lê crm_project_phases"
  on public.crm_project_phases for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_project_phases" on public.crm_project_phases;
create policy "Equipe interna cria crm_project_phases"
  on public.crm_project_phases for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_project_phases" on public.crm_project_phases;
create policy "Equipe interna atualiza crm_project_phases"
  on public.crm_project_phases for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_project_phases" on public.crm_project_phases;
create policy "Equipe interna apaga crm_project_phases"
  on public.crm_project_phases for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Tarefas de uma etapa. "comments" guarda o histórico de comentários como
-- jsonb (array de {id, authorId, authorName, body, createdAt}) — evita uma
-- quinta tabela só para comentários, fora do conjunto de tabelas desta fase.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_project_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  project_id uuid not null references public.crm_projects (id) on delete cascade,
  phase_id uuid references public.crm_project_phases (id) on delete cascade,

  title text not null,
  description text,
  assignee_id uuid references public.profiles (id) on delete set null,
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta')),
  due_at timestamptz,

  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluido')),
  completed_at timestamptz,

  comments jsonb not null default '[]'::jsonb,

  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_project_tasks enable row level security;

create index if not exists crm_project_tasks_project_idx on public.crm_project_tasks (project_id);
create index if not exists crm_project_tasks_phase_idx on public.crm_project_tasks (phase_id);
create index if not exists crm_project_tasks_assignee_idx on public.crm_project_tasks (assignee_id);
create index if not exists crm_project_tasks_status_idx on public.crm_project_tasks (status);

drop trigger if exists set_crm_project_tasks_updated_at on public.crm_project_tasks;
create trigger set_crm_project_tasks_updated_at
  before update on public.crm_project_tasks
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_project_tasks" on public.crm_project_tasks;
create policy "Equipe interna lê crm_project_tasks"
  on public.crm_project_tasks for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_project_tasks" on public.crm_project_tasks;
create policy "Equipe interna cria crm_project_tasks"
  on public.crm_project_tasks for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_project_tasks" on public.crm_project_tasks;
create policy "Equipe interna atualiza crm_project_tasks"
  on public.crm_project_tasks for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_project_tasks" on public.crm_project_tasks;
create policy "Equipe interna apaga crm_project_tasks"
  on public.crm_project_tasks for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Arquivos do projeto (task_id nulo) ou de uma tarefa específica. Mesmo
-- padrão de public.crm_lead_files — só os metadados aqui, o binário fica no
-- bucket Storage privado crm-project-files (criado abaixo).
-- ----------------------------------------------------------------------------
create table if not exists public.crm_project_files (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  project_id uuid not null references public.crm_projects (id) on delete cascade,
  task_id uuid references public.crm_project_tasks (id) on delete cascade,

  storage_path text not null,
  file_name text not null,
  file_size integer,
  mime_type text,
  uploaded_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_project_files enable row level security;

create index if not exists crm_project_files_project_idx on public.crm_project_files (project_id);
create index if not exists crm_project_files_task_idx on public.crm_project_files (task_id);

drop policy if exists "Equipe interna lê crm_project_files" on public.crm_project_files;
create policy "Equipe interna lê crm_project_files"
  on public.crm_project_files for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_project_files" on public.crm_project_files;
create policy "Equipe interna cria crm_project_files"
  on public.crm_project_files for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_project_files" on public.crm_project_files;
create policy "Equipe interna apaga crm_project_files"
  on public.crm_project_files for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Bucket Storage privado para os arquivos de projeto — mesmo padrão do
-- crm-lead-files (Fase 4): sem policy de update, acesso só por
-- is_internal_staff().
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('crm-project-files', 'crm-project-files', false)
on conflict (id) do nothing;

drop policy if exists "Equipe interna lê arquivos crm-project-files" on storage.objects;
create policy "Equipe interna lê arquivos crm-project-files"
  on storage.objects for select
  using (bucket_id = 'crm-project-files' and public.is_internal_staff());
drop policy if exists "Equipe interna envia arquivos crm-project-files" on storage.objects;
create policy "Equipe interna envia arquivos crm-project-files"
  on storage.objects for insert
  with check (bucket_id = 'crm-project-files' and public.is_internal_staff());
drop policy if exists "Equipe interna apaga arquivos crm-project-files" on storage.objects;
create policy "Equipe interna apaga arquivos crm-project-files"
  on storage.objects for delete
  using (bucket_id = 'crm-project-files' and public.is_internal_staff());
