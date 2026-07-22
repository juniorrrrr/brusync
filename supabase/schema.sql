-- Rode este script no SQL Editor do seu projeto Supabase (Dashboard > SQL Editor).
-- Cria a tabela que recebe os pedidos de diagnóstico enviados pelo formulário de contato do site.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text not null,
  phone text,
  message text
);

-- RLS habilitado: por padrão ninguém pode ler/gravar. O insert é feito pelo
-- servidor (Server Action) usando a service role key, que ignora RLS — não é
-- necessário criar policy de insert para o anon key.
alter table public.leads enable row level security;

-- ============================================================================
-- Leads de download de materiais (eBooks, checklists, guias e templates).
-- Cada linha é um evento de download: um mesmo e-mail pode aparecer várias
-- vezes (um registro por download), o que permite calcular "quantidade de
-- downloads" e "material mais baixado" com uma query de agregação simples.
-- ============================================================================
create table if not exists public.material_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Identificação do lead
  name text not null,
  email text not null,
  phone text not null,

  -- Material baixado
  material_slug text not null,
  material_title text not null,

  -- Atribuição / origem
  source text,
  referer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,

  -- Ambiente do visitante
  user_agent text,
  device text,
  os text,
  browser text,
  language text,

  -- Recorrência (calculado no servidor no momento do insert)
  visitor_id text,
  first_visit timestamptz,
  last_visit timestamptz,
  download_count integer not null default 1,

  -- Sinais anti-abuso (nunca exibidos publicamente, usados apenas para
  -- auditoria e rate limiting no servidor)
  ip_address text,
  turnstile_verified boolean not null default false
);

alter table public.material_leads enable row level security;

-- Índices de suporte às consultas mais comuns: rate limiting por IP,
-- histórico por e-mail e relatório de "material mais baixado".
create index if not exists material_leads_ip_created_idx
  on public.material_leads (ip_address, created_at desc);
create index if not exists material_leads_email_idx
  on public.material_leads (email);
create index if not exists material_leads_slug_idx
  on public.material_leads (material_slug);

-- ============================================================================
-- Tracking & Attribution — colunas adicionais, aditivas apenas.
-- Reaproveita todas as colunas já existentes (utm_*, referer, device, os,
-- browser, language, visitor_id, first_visit, last_visit em material_leads);
-- só adiciona o que ainda não existe em cada tabela. Nenhuma tabela é
-- recriada e nenhum dado existente é alterado.
-- ============================================================================

-- material_leads: click ids das plataformas de anúncio, landing page da
-- primeira visita, timezone e session_id (novos na infraestrutura de
-- atribuição — utm_*, referer, device/os/browser/language, visitor_id,
-- first_visit e last_visit já existiam e são reaproveitados).
alter table public.material_leads add column if not exists gclid text;
alter table public.material_leads add column if not exists fbclid text;
alter table public.material_leads add column if not exists msclkid text;
alter table public.material_leads add column if not exists ttclid text;
alter table public.material_leads add column if not exists landing_page text;
alter table public.material_leads add column if not exists timezone text;
alter table public.material_leads add column if not exists session_id text;

-- leads (formulário de contato): ainda não tinha nenhuma coluna de
-- atribuição — recebe o mesmo conjunto completo usado em material_leads,
-- para que os dois formulários fiquem com a mesma estrutura de attribution.
alter table public.leads add column if not exists utm_source text;
alter table public.leads add column if not exists utm_medium text;
alter table public.leads add column if not exists utm_campaign text;
alter table public.leads add column if not exists utm_content text;
alter table public.leads add column if not exists utm_term text;
alter table public.leads add column if not exists gclid text;
alter table public.leads add column if not exists fbclid text;
alter table public.leads add column if not exists msclkid text;
alter table public.leads add column if not exists ttclid text;
alter table public.leads add column if not exists landing_page text;
alter table public.leads add column if not exists referer text;
alter table public.leads add column if not exists first_visit timestamptz;
alter table public.leads add column if not exists last_visit timestamptz;
alter table public.leads add column if not exists visitor_id text;
alter table public.leads add column if not exists session_id text;
alter table public.leads add column if not exists device text;
alter table public.leads add column if not exists os text;
alter table public.leads add column if not exists browser text;
alter table public.leads add column if not exists language text;
alter table public.leads add column if not exists timezone text;
alter table public.leads add column if not exists user_agent text;

-- Sinal anti-abuso usado para rate limiting no servidor (mesmo padrão de
-- material_leads: nunca exibido publicamente).
alter table public.leads add column if not exists ip_address text;

create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_ip_created_idx on public.leads (ip_address, created_at desc);
create index if not exists leads_visitor_created_idx on public.leads (visitor_id, created_at desc);
create index if not exists leads_session_created_idx on public.leads (session_id, created_at desc);

-- ============================================================================
-- Brusync OS — perfis de usuário do painel interno (login em /login).
-- Cada linha espelha um usuário do Supabase Auth (auth.users), acrescentando
-- o papel (role) usado para controle de acesso. Nada aqui concede permissões
-- ainda — é só a estrutura de dados; a Fase 1 do Brusync OS só autentica.
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text,
  email text,
  role text not null default 'cliente'
    check (role in ('administrador', 'gestor', 'comercial', 'atendimento', 'cliente'))
);

alter table public.profiles enable row level security;

-- Cada usuário autenticado só pode ler o próprio perfil. Não há policy de
-- insert/update para anon/authenticated: a criação é feita pelo trigger
-- abaixo (roda como security definer) e mudar o papel de alguém deve
-- passar pela service role key, fora do alcance do próprio usuário.
drop policy if exists "Usuários podem ver o próprio perfil" on public.profiles;
create policy "Usuários podem ver o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create index if not exists profiles_role_idx on public.profiles (role);

-- Cria automaticamente um perfil (role padrão "cliente") sempre que um novo
-- usuário é criado no Supabase Auth — assim nenhum login fica sem perfil.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Brusync OS — CRM (Fase 2): pipeline comercial, leads de trabalho e clientes.
-- Tudo aditivo: public.leads (captura do formulário do site), material_leads
-- e profiles continuam exatamente como estão. crm_leads é a entidade de
-- funil comercial (diferente do registro bruto de marketing em public.leads)
-- e pode opcionalmente referenciar o lead de marketing que a originou via
-- source_lead_id — leads criados manualmente pelo time comercial não têm
-- esse vínculo.
-- ============================================================================

-- Função utilitária para manter updated_at em dia nas tabelas que a possuem.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Estágios do pipeline. Guardados em tabela (não enum) para permitir que uma
-- fase futura ofereça uma UI de configuração sem exigir migration de schema;
-- esta fase não entrega essa UI, só a estrutura.
-- ----------------------------------------------------------------------------
create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  key text not null unique,
  label text not null,
  color text not null default 'neutral' check (color in ('info', 'warn', 'ok', 'neutral', 'danger')),
  position integer not null,
  is_won boolean not null default false
);

alter table public.pipeline_stages enable row level security;

insert into public.pipeline_stages (key, label, color, position, is_won)
values
  ('novo', 'Novo', 'info', 1, false),
  ('contato', 'Em contato', 'warn', 2, false),
  ('qualificado', 'Qualificado', 'warn', 3, false),
  ('proposta', 'Proposta', 'info', 4, false),
  ('fechado', 'Fechado', 'ok', 5, true)
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- Leads do funil comercial (entidade de trabalho do CRM).
-- ----------------------------------------------------------------------------
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_lead_id uuid references public.leads (id) on delete set null,
  name text not null,
  company text,
  email text,
  phone text,
  origin text,
  stage_id uuid not null references public.pipeline_stages (id),
  owner_id uuid references public.profiles (id) on delete set null,
  potential_value numeric(14, 2),
  score integer not null default 0,
  tags text[] not null default '{}',
  last_interaction_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_leads enable row level security;

create index if not exists crm_leads_stage_idx on public.crm_leads (stage_id);
create index if not exists crm_leads_owner_idx on public.crm_leads (owner_id);
create index if not exists crm_leads_email_idx on public.crm_leads (email);
create index if not exists crm_leads_created_idx on public.crm_leads (created_at desc);
create index if not exists crm_leads_source_lead_idx on public.crm_leads (source_lead_id);

drop trigger if exists set_crm_leads_updated_at on public.crm_leads;
create trigger set_crm_leads_updated_at
  before update on public.crm_leads
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Timeline unificada de um lead: notas, mudanças de estágio, ligações,
-- e-mails, reuniões e tarefas. due_at/done só fazem sentido para type='task'
-- ("Próximas tarefas" no dashboard); ficam null para os demais tipos.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_lead_activities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  crm_lead_id uuid not null references public.crm_leads (id) on delete cascade,
  type text not null check (type in ('note', 'stage_change', 'call', 'email', 'meeting', 'task', 'system')),
  title text not null,
  body text,
  metadata jsonb,
  due_at timestamptz,
  done boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_lead_activities enable row level security;

create index if not exists crm_lead_activities_lead_idx on public.crm_lead_activities (crm_lead_id, created_at desc);
create index if not exists crm_lead_activities_task_idx on public.crm_lead_activities (due_at) where type = 'task' and done = false;

-- ----------------------------------------------------------------------------
-- Arquivos anexados a um lead. Os binários ficam no bucket Storage privado
-- crm-lead-files (criado abaixo); esta tabela só guarda os metadados.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_lead_files (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  crm_lead_id uuid not null references public.crm_leads (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_size integer,
  mime_type text,
  uploaded_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_lead_files enable row level security;

create index if not exists crm_lead_files_lead_idx on public.crm_lead_files (crm_lead_id);

-- ----------------------------------------------------------------------------
-- Clientes: entidade própria (não é uma view/filtro sobre crm_leads), com
-- vínculo opcional ao lead que a originou, para suportar ciclo de vida e
-- campos próprios de cliente sem acoplar ao funil de vendas.
-- ----------------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_crm_lead_id uuid references public.crm_leads (id) on delete set null,
  company text not null,
  name text,
  email text,
  phone text,
  owner_id uuid references public.profiles (id) on delete set null,
  status text not null default 'ativo' check (status in ('ativo', 'inativo', 'em_risco')),
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.clients enable row level security;

create index if not exists clients_owner_idx on public.clients (owner_id);
create index if not exists clients_status_idx on public.clients (status);
create index if not exists clients_source_lead_idx on public.clients (source_crm_lead_id);

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS: acesso interno (equipe Brusync). O papel "cliente" de profiles.role é
-- reservado a um futuro portal externo — nesta fase ele não enxerga nenhuma
-- tabela de CRM. Toda leitura/escrita passa pelo client autenticado por
-- cookie (services/supabase/authServer.ts), nunca pela service role.
-- ----------------------------------------------------------------------------
create or replace function public.is_internal_staff()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('administrador', 'gestor', 'comercial', 'atendimento')
  );
$$;

drop policy if exists "Equipe interna lê pipeline_stages" on public.pipeline_stages;
create policy "Equipe interna lê pipeline_stages"
  on public.pipeline_stages for select
  using (public.is_internal_staff());

drop policy if exists "Equipe interna lê crm_leads" on public.crm_leads;
create policy "Equipe interna lê crm_leads"
  on public.crm_leads for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_leads" on public.crm_leads;
create policy "Equipe interna cria crm_leads"
  on public.crm_leads for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_leads" on public.crm_leads;
create policy "Equipe interna atualiza crm_leads"
  on public.crm_leads for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_leads" on public.crm_leads;
create policy "Equipe interna apaga crm_leads"
  on public.crm_leads for delete
  using (public.is_internal_staff());

drop policy if exists "Equipe interna lê crm_lead_activities" on public.crm_lead_activities;
create policy "Equipe interna lê crm_lead_activities"
  on public.crm_lead_activities for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_lead_activities" on public.crm_lead_activities;
create policy "Equipe interna cria crm_lead_activities"
  on public.crm_lead_activities for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_lead_activities" on public.crm_lead_activities;
create policy "Equipe interna atualiza crm_lead_activities"
  on public.crm_lead_activities for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_lead_activities" on public.crm_lead_activities;
create policy "Equipe interna apaga crm_lead_activities"
  on public.crm_lead_activities for delete
  using (public.is_internal_staff());

drop policy if exists "Equipe interna lê crm_lead_files" on public.crm_lead_files;
create policy "Equipe interna lê crm_lead_files"
  on public.crm_lead_files for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_lead_files" on public.crm_lead_files;
create policy "Equipe interna cria crm_lead_files"
  on public.crm_lead_files for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_lead_files" on public.crm_lead_files;
create policy "Equipe interna apaga crm_lead_files"
  on public.crm_lead_files for delete
  using (public.is_internal_staff());

drop policy if exists "Equipe interna lê clients" on public.clients;
create policy "Equipe interna lê clients"
  on public.clients for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria clients" on public.clients;
create policy "Equipe interna cria clients"
  on public.clients for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza clients" on public.clients;
create policy "Equipe interna atualiza clients"
  on public.clients for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga clients" on public.clients;
create policy "Equipe interna apaga clients"
  on public.clients for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Storage: bucket privado para os arquivos anexados a um lead. Nunca
-- público — acesso só via signed URL gerada no servidor.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('crm-lead-files', 'crm-lead-files', false)
on conflict (id) do nothing;

drop policy if exists "Equipe interna lê arquivos crm-lead-files" on storage.objects;
create policy "Equipe interna lê arquivos crm-lead-files"
  on storage.objects for select
  using (bucket_id = 'crm-lead-files' and public.is_internal_staff());
drop policy if exists "Equipe interna envia arquivos crm-lead-files" on storage.objects;
create policy "Equipe interna envia arquivos crm-lead-files"
  on storage.objects for insert
  with check (bucket_id = 'crm-lead-files' and public.is_internal_staff());
drop policy if exists "Equipe interna apaga arquivos crm-lead-files" on storage.objects;
create policy "Equipe interna apaga arquivos crm-lead-files"
  on storage.objects for delete
  using (bucket_id = 'crm-lead-files' and public.is_internal_staff());

-- ============================================================================
-- Brusync OS — CRM (Fase 3): Lead Workspace.
-- Aditivo apenas. crm_leads ganha duas colunas novas (job_title, city).
-- Notas e tarefas passam a ser entidades próprias — mutáveis (editar/excluir),
-- diferente de crm_lead_activities, que continua sendo só o log cronológico
-- e imutável ("Nota criada", "Tarefa concluída", etc. são gerados a partir
-- delas, nunca editados/apagados diretamente).
-- ============================================================================

alter table public.crm_leads add column if not exists job_title text;
alter table public.crm_leads add column if not exists city text;

-- Amplia o conjunto de tipos de atividade aceitos no log (superset do que já
-- existia — nenhuma linha existente deixa de satisfazer o check).
alter table public.crm_lead_activities drop constraint if exists crm_lead_activities_type_check;
alter table public.crm_lead_activities add constraint crm_lead_activities_type_check
  check (type in (
    'note', 'stage_change', 'call', 'email', 'meeting', 'task', 'system',
    'lead_updated', 'owner_change',
    'note_created', 'note_updated', 'note_deleted',
    'task_created', 'task_updated', 'task_completed', 'task_deleted',
    'file_upload', 'file_delete'
  ));

-- ----------------------------------------------------------------------------
-- Notas do lead: editor com autosave, autor, editar e excluir.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_lead_notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  crm_lead_id uuid not null references public.crm_leads (id) on delete cascade,
  body text not null,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_lead_notes enable row level security;

create index if not exists crm_lead_notes_lead_idx on public.crm_lead_notes (crm_lead_id, created_at desc);

drop trigger if exists set_crm_lead_notes_updated_at on public.crm_lead_notes;
create trigger set_crm_lead_notes_updated_at
  before update on public.crm_lead_notes
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Tarefas do lead: checklist com status, prioridade, prazo e responsável.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_lead_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  crm_lead_id uuid not null references public.crm_leads (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_at timestamptz,
  completed_at timestamptz,
  assignee_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_lead_tasks enable row level security;

create index if not exists crm_lead_tasks_lead_idx on public.crm_lead_tasks (crm_lead_id, created_at desc);
create index if not exists crm_lead_tasks_assignee_idx on public.crm_lead_tasks (assignee_id);
create index if not exists crm_lead_tasks_pending_idx on public.crm_lead_tasks (due_at) where status != 'done';

drop trigger if exists set_crm_lead_tasks_updated_at on public.crm_lead_tasks;
create trigger set_crm_lead_tasks_updated_at
  before update on public.crm_lead_tasks
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS: mesmo padrão de acesso interno das demais tabelas do CRM.
-- ----------------------------------------------------------------------------
drop policy if exists "Equipe interna lê crm_lead_notes" on public.crm_lead_notes;
create policy "Equipe interna lê crm_lead_notes"
  on public.crm_lead_notes for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_lead_notes" on public.crm_lead_notes;
create policy "Equipe interna cria crm_lead_notes"
  on public.crm_lead_notes for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_lead_notes" on public.crm_lead_notes;
create policy "Equipe interna atualiza crm_lead_notes"
  on public.crm_lead_notes for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_lead_notes" on public.crm_lead_notes;
create policy "Equipe interna apaga crm_lead_notes"
  on public.crm_lead_notes for delete
  using (public.is_internal_staff());

drop policy if exists "Equipe interna lê crm_lead_tasks" on public.crm_lead_tasks;
create policy "Equipe interna lê crm_lead_tasks"
  on public.crm_lead_tasks for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_lead_tasks" on public.crm_lead_tasks;
create policy "Equipe interna cria crm_lead_tasks"
  on public.crm_lead_tasks for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_lead_tasks" on public.crm_lead_tasks;
create policy "Equipe interna atualiza crm_lead_tasks"
  on public.crm_lead_tasks for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_lead_tasks" on public.crm_lead_tasks;
create policy "Equipe interna apaga crm_lead_tasks"
  on public.crm_lead_tasks for delete
  using (public.is_internal_staff());

-- ============================================================================
-- Brusync OS — CRM (Fase 4): Pipeline Comercial Inteligente.
-- Aditivo apenas. crm_leads ganha lost_reason/lost_at (perda é um desfecho
-- ortogonal ao estágio — um lead pode ser perdido estando em qualquer etapa,
-- não é mais um estágio do funil). Nova tabela crm_lead_stage_history
-- registra estruturadamente quando cada lead entrou/saiu de cada etapa,
-- necessária para calcular conversão entre etapas, tempo médio por etapa e
-- tempo médio até venda com dado real (a Timeline em texto livre não serve
-- para agregação). Ampliação da activities: novos tipos automation/perda/
-- cliente automático.
-- ============================================================================

alter table public.crm_leads add column if not exists lost_reason text
  check (lost_reason in ('preco', 'sem_interesse', 'concorrente', 'sem_orcamento', 'nao_respondeu', 'sem_perfil', 'outro'));
alter table public.crm_leads add column if not exists lost_at timestamptz;

create index if not exists crm_leads_lost_idx on public.crm_leads (lost_reason) where lost_reason is not null;

alter table public.crm_lead_activities drop constraint if exists crm_lead_activities_type_check;
alter table public.crm_lead_activities add constraint crm_lead_activities_type_check
  check (type in (
    'note', 'stage_change', 'call', 'email', 'meeting', 'task', 'system',
    'lead_updated', 'owner_change',
    'note_created', 'note_updated', 'note_deleted',
    'task_created', 'task_updated', 'task_completed', 'task_deleted',
    'file_upload', 'file_delete',
    'automation', 'lead_lost', 'lead_reopened', 'client_created'
  ));

-- ----------------------------------------------------------------------------
-- Histórico de estágio: uma linha por permanência de um lead em um estágio.
-- exited_at fica null enquanto o lead está atualmente nesse estágio — nunca
-- deve haver mais de uma linha aberta (exited_at is null) por lead; isso é
-- garantido pela aplicação (fecha a linha atual antes de abrir a próxima),
-- não por uma constraint de banco, para manter a migration simples.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_lead_stage_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  crm_lead_id uuid not null references public.crm_leads (id) on delete cascade,
  stage_id uuid not null references public.pipeline_stages (id),
  entered_at timestamptz not null default now(),
  exited_at timestamptz
);

alter table public.crm_lead_stage_history enable row level security;

create index if not exists crm_lead_stage_history_lead_idx on public.crm_lead_stage_history (crm_lead_id, entered_at desc);
create index if not exists crm_lead_stage_history_open_idx on public.crm_lead_stage_history (crm_lead_id) where exited_at is null;
create index if not exists crm_lead_stage_history_stage_idx on public.crm_lead_stage_history (stage_id);

drop policy if exists "Equipe interna lê crm_lead_stage_history" on public.crm_lead_stage_history;
create policy "Equipe interna lê crm_lead_stage_history"
  on public.crm_lead_stage_history for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_lead_stage_history" on public.crm_lead_stage_history;
create policy "Equipe interna cria crm_lead_stage_history"
  on public.crm_lead_stage_history for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_lead_stage_history" on public.crm_lead_stage_history;
create policy "Equipe interna atualiza crm_lead_stage_history"
  on public.crm_lead_stage_history for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ============================================================================
-- Brusync OS — Marketing Intelligence (Fase 5).
-- Aditivo apenas. Nova tabela marketing_campaign_spend para lançamento manual
-- de investimento por campanha (utm_source + utm_campaign) e mês — ainda não
-- há integração real com Meta Ads/Google Ads API, então ROAS/ROI/CAC só
-- existem para campanhas com investimento lançado manualmente aqui (sem
-- lançamento, a métrica aparece como "—", nunca como zero inventado).
-- "Receita" em todo o módulo é a soma de potential_value dos crm_leads que
-- chegaram ao estágio is_won=true — não existe (e esta fase não cria) um
-- campo de valor fechado separado do valor potencial.
-- ============================================================================

create index if not exists leads_utm_campaign_idx on public.leads (utm_source, utm_campaign);

create table if not exists public.marketing_campaign_spend (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  utm_source text not null,
  utm_campaign text not null,
  period_month date not null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'BRL',
  notes text,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.marketing_campaign_spend enable row level security;

create unique index if not exists marketing_campaign_spend_unique_idx
  on public.marketing_campaign_spend (utm_source, utm_campaign, period_month);
create index if not exists marketing_campaign_spend_period_idx
  on public.marketing_campaign_spend (period_month desc);

drop trigger if exists set_marketing_campaign_spend_updated_at on public.marketing_campaign_spend;
create trigger set_marketing_campaign_spend_updated_at
  before update on public.marketing_campaign_spend
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê marketing_campaign_spend" on public.marketing_campaign_spend;
create policy "Equipe interna lê marketing_campaign_spend"
  on public.marketing_campaign_spend for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria marketing_campaign_spend" on public.marketing_campaign_spend;
create policy "Equipe interna cria marketing_campaign_spend"
  on public.marketing_campaign_spend for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza marketing_campaign_spend" on public.marketing_campaign_spend;
create policy "Equipe interna atualiza marketing_campaign_spend"
  on public.marketing_campaign_spend for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga marketing_campaign_spend" on public.marketing_campaign_spend;
create policy "Equipe interna apaga marketing_campaign_spend"
  on public.marketing_campaign_spend for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- public.leads e public.material_leads tinham RLS habilitado desde a Fase 1
-- mas nunca ganharam nenhuma policy de select — só a service role (usada só
-- no insert do formulário público) conseguia ler essas tabelas. Isso não
-- afetava o site público (que só insere), mas silenciosamente zerava tudo
-- que o CRM tenta ler dessas tabelas pelo client autenticado por cookie:
-- a atribuição de marketing em crm_leads.source_lead_id (WorkspaceSidebar,
-- o novo módulo Marketing Intelligence) e os downloads de materiais
-- (Dashboard "Materiais Baixados", "Últimos downloads", aba Downloads do
-- Lead Workspace) — todos ficavam sempre vazios/nulos em produção. Corrige
-- adicionando as mesmas policies de leitura interna já usadas em todas as
-- outras tabelas do CRM; o insert continua exclusivo da service role.
-- ----------------------------------------------------------------------------
drop policy if exists "Equipe interna lê leads" on public.leads;
create policy "Equipe interna lê leads"
  on public.leads for select
  using (public.is_internal_staff());

drop policy if exists "Equipe interna lê material_leads" on public.material_leads;
create policy "Equipe interna lê material_leads"
  on public.material_leads for select
  using (public.is_internal_staff());

-- ============================================================================
-- Brusync OS — Fase 6: infraestrutura de Integrações (aditivo apenas).
--
-- Esta fase NÃO conecta nenhuma plataforma real (Meta Ads, Google Ads, GA4,
-- WhatsApp, etc). Cria apenas a estrutura de dados que os módulos futuros vão
-- usar: o catálogo de integrações (public.integrations), o log de execução/
-- sincronização de cada uma (public.integration_logs) e o Event Bus — a fila
-- de eventos de domínio que o CRM publica sem conhecer quem os consome
-- (public.integration_events, um outbox: o CRM só grava aqui; um futuro
-- dispatcher lê as linhas "pending" e decide os destinos).
-- ============================================================================

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Identidade estável da integração (ex: "meta_ads", "google_ads", "n8n").
  -- Nunca muda depois de criado — é a chave que o código usa para localizar
  -- a linha, o nome de exibição (name) pode mudar livremente.
  provider text not null,
  category text not null
    check (category in ('publicidade', 'analytics', 'comunicacao', 'automacao', 'developer')),
  name text not null,
  description text,

  status text not null default 'desconectado'
    check (status in ('conectado', 'desconectado', 'erro', 'em_desenvolvimento')),
  enabled boolean not null default false,

  connected_at timestamptz,
  last_sync timestamptz,
  next_sync timestamptz,

  -- Configuração não-sensível (ex: frequência de sync, flags). Nenhuma
  -- credencial/token real deve ser gravada aqui nesta fase — não existe
  -- ainda um cofre de segredos (ver limitações no relatório da Fase 6).
  config jsonb not null default '{}'::jsonb,
  error text,

  -- 0–100, calculado por um futuro job de monitoramento a partir da taxa de
  -- sucesso dos logs recentes. Nulo enquanto não há dado suficiente.
  health_score integer check (health_score is null or health_score between 0 and 100)
);

alter table public.integrations enable row level security;

create unique index if not exists integrations_provider_idx on public.integrations (provider);
create index if not exists integrations_category_idx on public.integrations (category);
create index if not exists integrations_status_idx on public.integrations (status);

drop trigger if exists set_integrations_updated_at on public.integrations;
create trigger set_integrations_updated_at
  before update on public.integrations
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê integrations" on public.integrations;
create policy "Equipe interna lê integrations"
  on public.integrations for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza integrations" on public.integrations;
create policy "Equipe interna atualiza integrations"
  on public.integrations for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Log de execução por integração: sincronizações, tentativas de entrega de
-- evento, chamadas de webhook recebidas — qualquer coisa que aconteça "de
-- fora para dentro" ou "de dentro para fora" de uma integração. Alimenta a
-- tela de Logs e o dashboard de Saúde.
-- ----------------------------------------------------------------------------
create table if not exists public.integration_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  integration_id uuid references public.integrations (id) on delete cascade,
  event text not null,
  status text not null check (status in ('success', 'error', 'pending')),
  message text,
  payload jsonb,
  origin text,
  destination text,
  duration_ms integer
);

alter table public.integration_logs enable row level security;

create index if not exists integration_logs_integration_created_idx
  on public.integration_logs (integration_id, created_at desc);
create index if not exists integration_logs_status_idx on public.integration_logs (status);
create index if not exists integration_logs_created_idx on public.integration_logs (created_at desc);

drop policy if exists "Equipe interna lê integration_logs" on public.integration_logs;
create policy "Equipe interna lê integration_logs"
  on public.integration_logs for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria integration_logs" on public.integration_logs;
create policy "Equipe interna cria integration_logs"
  on public.integration_logs for insert
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Event Bus: outbox de eventos de domínio. O CRM (Leads, Tarefas, Clientes)
-- publica linhas aqui através de um único serviço (services/eventBus) e nunca
-- conhece quem vai processá-las — nesta fase ninguém processa (status fica
-- "pending" para sempre); um futuro dispatcher fará o fan-out para os
-- destinos reais (Meta Conversions API, GA4 Measurement Protocol, Webhooks,
-- Slack, N8N, ...), registrando cada tentativa em integration_logs.
-- ----------------------------------------------------------------------------
create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  event_type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,

  status text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  processed_at timestamptz,
  actor_id uuid references public.profiles (id) on delete set null
);

alter table public.integration_events enable row level security;

create index if not exists integration_events_type_created_idx
  on public.integration_events (event_type, created_at desc);
create index if not exists integration_events_status_idx on public.integration_events (status);

drop policy if exists "Equipe interna lê integration_events" on public.integration_events;
create policy "Equipe interna lê integration_events"
  on public.integration_events for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria integration_events" on public.integration_events;
create policy "Equipe interna cria integration_events"
  on public.integration_events for insert
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Catálogo inicial: uma linha por provider já conhecido, todas em
-- status "em_desenvolvimento"/desabilitadas — nenhuma credencial, nenhuma
-- conexão real. Idempotente (on conflict do nothing), seguro de rodar de novo.
-- ----------------------------------------------------------------------------
insert into public.integrations (provider, category, name, description, status, enabled)
values
  ('meta_ads', 'publicidade', 'Meta Ads', 'Conecte campanhas do Facebook e Instagram Ads para sincronizar leads e conversões.', 'em_desenvolvimento', false),
  ('google_ads', 'publicidade', 'Google Ads', 'Sincronize conversões e público-alvo diretamente com o Google Ads.', 'em_desenvolvimento', false),
  ('tiktok_ads', 'publicidade', 'TikTok Ads', 'Envie eventos de conversão para campanhas do TikTok Ads.', 'em_desenvolvimento', false),
  ('linkedin_ads', 'publicidade', 'LinkedIn Ads', 'Conecte campanhas B2B do LinkedIn Ads ao funil comercial.', 'em_desenvolvimento', false),
  ('microsoft_ads', 'publicidade', 'Microsoft Ads', 'Sincronize conversões com o Microsoft Advertising (Bing Ads).', 'em_desenvolvimento', false),
  ('ga4', 'analytics', 'Google Analytics 4', 'Envie eventos de negócio para o GA4 via Measurement Protocol.', 'em_desenvolvimento', false),
  ('gtm', 'analytics', 'Google Tag Manager', 'Gerencie tags e disparos de eventos do Brusync OS.', 'em_desenvolvimento', false),
  ('search_console', 'analytics', 'Google Search Console', 'Acompanhe desempenho orgânico e indexação do site.', 'em_desenvolvimento', false),
  ('clarity', 'analytics', 'Microsoft Clarity', 'Sessões e mapas de calor para entender o comportamento do visitante.', 'em_desenvolvimento', false),
  ('whatsapp', 'comunicacao', 'WhatsApp Business', 'Envie notificações automáticas de leads e tarefas pelo WhatsApp.', 'em_desenvolvimento', false),
  ('slack', 'comunicacao', 'Slack', 'Receba alertas de leads, tarefas e campanhas em canais do Slack.', 'em_desenvolvimento', false),
  ('discord', 'comunicacao', 'Discord', 'Envie notificações da operação comercial para um servidor Discord.', 'em_desenvolvimento', false),
  ('gmail', 'comunicacao', 'Gmail', 'Sincronize e envie e-mails do funil comercial pelo Gmail.', 'em_desenvolvimento', false),
  ('outlook', 'comunicacao', 'Outlook', 'Sincronize e envie e-mails do funil comercial pelo Outlook.', 'em_desenvolvimento', false),
  ('n8n', 'automacao', 'N8N', 'Dispare workflows customizados do N8N a partir de eventos do Brusync.', 'em_desenvolvimento', false),
  ('make', 'automacao', 'Make', 'Conecte o Brusync a milhares de apps via cenários do Make (antigo Integromat).', 'em_desenvolvimento', false),
  ('zapier', 'automacao', 'Zapier', 'Dispare Zaps automaticamente a partir de eventos do CRM.', 'em_desenvolvimento', false),
  ('api', 'developer', 'API Brusync', 'Acesso programático de leitura e escrita aos dados do Brusync OS.', 'em_desenvolvimento', false),
  ('webhook', 'developer', 'Webhooks', 'Receba eventos do Brusync em tempo real no seu próprio endpoint.', 'em_desenvolvimento', false),
  ('sdk', 'developer', 'SDK', 'Bibliotecas cliente para integrar o Brusync a aplicações próprias.', 'em_desenvolvimento', false)
on conflict (provider) do nothing;
