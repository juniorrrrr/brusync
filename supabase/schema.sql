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

-- ============================================================================
-- Brusync OS — Fase 7: Motor de Conversões (Jornada Comercial do Lead).
--
-- Aditivo apenas — nenhuma tabela existente é alterada. Adiciona o registro
-- estruturado e append-only da jornada comercial de cada lead (13 etapas,
-- da captação à ativação como cliente), com data/hora, usuário responsável,
-- origem da mudança, observação opcional e o score comercial daquele
-- momento. Complementar a public.crm_lead_activities (timeline genérica já
-- existente, que continua exatamente como está) e a public.crm_lead_stage_
-- history (histórico do Pipeline/Kanban, também inalterado) — a jornada é um
-- terceiro conceito, mais granular, que não substitui nenhum dos dois.
-- ============================================================================

create table if not exists public.crm_lead_journey_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  crm_lead_id uuid not null references public.crm_leads (id) on delete cascade,

  stage text not null check (stage in (
    'novo_lead', 'primeiro_contato', 'contato_realizado', 'lead_qualificado',
    'lead_desqualificado', 'reuniao_agendada', 'diagnostico', 'proposta_enviada',
    'negociacao', 'venda_ganha', 'venda_perdida', 'implantacao', 'cliente_ativo'
  )),

  -- "Data" e "Hora" do evento — normalmente = created_at, mas fica em campo
  -- próprio para permitir registrar um evento ocorrido no passado (ex.: uma
  -- reunião que já aconteceu e só foi lançada no sistema depois).
  occurred_at timestamptz not null default now(),

  actor_id uuid references public.profiles (id) on delete set null,
  origin text not null default 'manual' check (origin in ('manual', 'automatico', 'sistema')),
  note text,

  -- Score comercial no momento deste evento (ver domain/journey/stages.ts) —
  -- guardado aqui, e não recalculado depois, para que o histórico de score
  -- de um lead nunca mude retroativamente só porque a tabela de pontos foi
  -- ajustada no futuro.
  score integer not null check (score >= 0 and score <= 100)
);

alter table public.crm_lead_journey_events enable row level security;

create index if not exists crm_lead_journey_events_lead_idx
  on public.crm_lead_journey_events (crm_lead_id, occurred_at);
create index if not exists crm_lead_journey_events_stage_idx
  on public.crm_lead_journey_events (stage);

-- Somente leitura e inserção — nunca update, nunca delete. "Nada pode ser
-- perdido" e "nenhuma alteração pode sobrescrever outra" são garantidos aqui
-- no nível de permissão (RLS), não apenas por convenção no código da
-- aplicação: não existe policy de update/delete para nenhum papel.
drop policy if exists "Equipe interna lê crm_lead_journey_events" on public.crm_lead_journey_events;
create policy "Equipe interna lê crm_lead_journey_events"
  on public.crm_lead_journey_events for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_lead_journey_events" on public.crm_lead_journey_events;
create policy "Equipe interna cria crm_lead_journey_events"
  on public.crm_lead_journey_events for insert
  with check (public.is_internal_staff());

-- ============================================================================
-- Brusync OS — Fase 8: Conversions Hub.
--
-- Aditivo apenas — nenhuma tabela existente é alterada. Transforma os
-- eventos já publicados pelo Motor de Conversões (Fase 7, via
-- services/eventBus → public.integration_events) em "eventos de conversão"
-- normalizados e prontos para envio a plataformas de anúncio — sem nunca
-- chamar nenhuma API externa nesta fase.
--
-- Três tabelas, um conceito cada:
--   conversion_events            → o evento preparado (Lead, Qualified Lead,
--                                   Meeting Scheduled, Proposal Sent,
--                                   Purchase, Lost Lead, Client Activated).
--   conversion_deliveries        → a fila de envio: uma linha por par
--                                   (evento, destino), com status/tentativas/
--                                   último erro.
--   conversion_delivery_attempts → histórico append-only de cada tentativa
--                                   de envio de uma delivery.
-- ============================================================================

create table if not exists public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  conversion_type text not null check (conversion_type in (
    'lead', 'qualified_lead', 'meeting_scheduled', 'proposal_sent',
    'purchase', 'lost_lead', 'client_activated'
  )),

  -- De onde, dentro do Brusync, este evento nasceu (ex.: "Cadastro de Lead",
  -- "Pipeline", "Jornada Comercial") — não confundir com utm_source, que é a
  -- origem de marketing do lead em si.
  origin text not null default 'crm',

  crm_lead_id uuid references public.crm_leads (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,

  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  campaign_key text,
  gclid text,
  fbclid text,
  msclkid text,
  ttclid text,

  occurred_at timestamptz not null default now(),
  actor_id uuid references public.profiles (id) on delete set null,

  value numeric(14, 2),
  currency text not null default 'BRL',

  -- "Pronto para envio" — falso apenas quando faltam dados mínimos (por
  -- exemplo, o lead de origem foi excluído depois deste evento existir).
  ready boolean not null default true,

  -- Rastreabilidade: qual linha de public.integration_events (Fase 6) deu
  -- origem a este evento de conversão.
  integration_event_id uuid references public.integration_events (id) on delete set null
);

alter table public.conversion_events enable row level security;

create index if not exists conversion_events_lead_idx on public.conversion_events (crm_lead_id);
create index if not exists conversion_events_type_idx on public.conversion_events (conversion_type);
create index if not exists conversion_events_created_idx on public.conversion_events (created_at desc);

drop policy if exists "Equipe interna lê conversion_events" on public.conversion_events;
create policy "Equipe interna lê conversion_events"
  on public.conversion_events for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria conversion_events" on public.conversion_events;
create policy "Equipe interna cria conversion_events"
  on public.conversion_events for insert
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Fila de envio: uma linha por (evento, destino). Ao contrário de
-- conversion_events, esta tabela é mutável de propósito — status/attempts/
-- last_error/sent_at mudam conforme um futuro dispatcher processa a fila.
-- ----------------------------------------------------------------------------
create table if not exists public.conversion_deliveries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  conversion_event_id uuid not null references public.conversion_events (id) on delete cascade,
  destination text not null check (destination in (
    'meta_ads', 'google_ads', 'ga4', 'tiktok_ads', 'linkedin_ads', 'webhook'
  )),

  status text not null default 'pendente' check (status in ('pendente', 'enviado', 'falhou')),
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz
);

alter table public.conversion_deliveries enable row level security;

create index if not exists conversion_deliveries_event_idx on public.conversion_deliveries (conversion_event_id);
create index if not exists conversion_deliveries_destination_idx on public.conversion_deliveries (destination);
create index if not exists conversion_deliveries_status_idx on public.conversion_deliveries (status);

drop trigger if exists set_conversion_deliveries_updated_at on public.conversion_deliveries;
create trigger set_conversion_deliveries_updated_at
  before update on public.conversion_deliveries
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê conversion_deliveries" on public.conversion_deliveries;
create policy "Equipe interna lê conversion_deliveries"
  on public.conversion_deliveries for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria conversion_deliveries" on public.conversion_deliveries;
create policy "Equipe interna cria conversion_deliveries"
  on public.conversion_deliveries for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza conversion_deliveries" on public.conversion_deliveries;
create policy "Equipe interna atualiza conversion_deliveries"
  on public.conversion_deliveries for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Histórico append-only de tentativas de envio — nunca update, nunca delete,
-- mesmo padrão de imutabilidade da Fase 7 (sem policy de update/delete).
-- ----------------------------------------------------------------------------
create table if not exists public.conversion_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  conversion_delivery_id uuid not null references public.conversion_deliveries (id) on delete cascade,
  status text not null check (status in ('sucesso', 'erro')),
  message text,
  duration_ms integer
);

alter table public.conversion_delivery_attempts enable row level security;

create index if not exists conversion_delivery_attempts_delivery_idx
  on public.conversion_delivery_attempts (conversion_delivery_id, created_at desc);

drop policy if exists "Equipe interna lê conversion_delivery_attempts" on public.conversion_delivery_attempts;
create policy "Equipe interna lê conversion_delivery_attempts"
  on public.conversion_delivery_attempts for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria conversion_delivery_attempts" on public.conversion_delivery_attempts;
create policy "Equipe interna cria conversion_delivery_attempts"
  on public.conversion_delivery_attempts for insert
  with check (public.is_internal_staff());

-- ============================================================================
-- Brusync OS — Fase 9: integração real com a Meta Conversions API.
--
-- Aditivo apenas — reaproveita toda a infraestrutura das Fases 6-8: o
-- provider "meta_ads" já existe em public.integrations, a fila já existe em
-- public.conversion_deliveries e o histórico de tentativas já existe em
-- public.conversion_delivery_attempts. Esta migration só (1) alarga o status
-- da fila para incluir "enviando" e "reprocessando", (2) adiciona onde
-- guardar o Access Token do Meta criptografado (nunca em texto puro) e (3)
-- adiciona onde guardar o payload enviado e a resposta da Meta em cada
-- tentativa, para a tela de Logs.
-- ============================================================================

do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
    where rel.relname = 'conversion_deliveries'
      and con.contype = 'c'
      and att.attname = 'status'
  loop
    execute format('alter table public.conversion_deliveries drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.conversion_deliveries
  add constraint conversion_deliveries_status_check
  check (status in ('pendente', 'enviando', 'enviado', 'falhou', 'reprocessando'));

-- Access Token do Meta: nunca em texto puro — criptografado (AES-256-GCM)
-- com a chave do servidor (env META_TOKEN_ENCRYPTION_KEY, nunca no banco,
-- nunca no frontend). Ver services/metaConversionsApi/tokenCrypto.ts.
alter table public.integrations add column if not exists access_token_ciphertext text;
alter table public.integrations add column if not exists access_token_iv text;

-- Payload exato enviado e corpo da resposta da Meta (ou do erro), para a
-- tela de Logs mostrar dados reais, nunca resumos fabricados.
alter table public.conversion_delivery_attempts add column if not exists request_payload jsonb;
alter table public.conversion_delivery_attempts add column if not exists response_body jsonb;
alter table public.conversion_delivery_attempts add column if not exists http_status integer;

-- ============================================================================
-- Brusync OS — Fase 10: Motor de Automações (Workflow Engine).
--
-- Aditivo apenas — nenhuma tabela existente é alterada. Módulo totalmente
-- desacoplado do restante do CRM: nenhuma integração externa é feita aqui,
-- apenas o motor SE → CONDIÇÃO → AÇÃO que futuras integrações vão consumir.
--
-- Quatro tabelas, um conceito cada:
--   automation_workflows  → a automação em si (nome, status, prioridade,
--                           condição, ação, descrição) — mutável.
--   automation_triggers   → o gatilho de uma automação (um por workflow
--                           nesta fase; separado para permitir múltiplos
--                           gatilhos por workflow no futuro sem redesenho).
--   automation_executions → histórico append-only de cada disparo avaliado.
--   automation_logs       → log técnico append-only, granular, por execução.
-- ============================================================================

create table if not exists public.automation_workflows (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  description text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta')),

  condition_type text not null default 'sempre' check (condition_type in (
    'sempre', 'origem_igual', 'score_maior_igual', 'dias_parado_maior_igual', 'estagio_igual'
  )),
  condition_config jsonb not null default '{}'::jsonb,

  action_type text not null check (action_type in (
    'mover_pipeline', 'criar_tarefa', 'criar_alerta', 'solicitar_motivo_perda', 'criar_onboarding'
  )),
  action_config jsonb not null default '{}'::jsonb,

  created_by uuid references public.profiles (id) on delete set null
);

alter table public.automation_workflows enable row level security;

create index if not exists automation_workflows_status_idx on public.automation_workflows (status);

drop trigger if exists set_automation_workflows_updated_at on public.automation_workflows;
create trigger set_automation_workflows_updated_at
  before update on public.automation_workflows
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê automation_workflows" on public.automation_workflows;
create policy "Equipe interna lê automation_workflows"
  on public.automation_workflows for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria automation_workflows" on public.automation_workflows;
create policy "Equipe interna cria automation_workflows"
  on public.automation_workflows for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza automation_workflows" on public.automation_workflows;
create policy "Equipe interna atualiza automation_workflows"
  on public.automation_workflows for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga automation_workflows" on public.automation_workflows;
create policy "Equipe interna apaga automation_workflows"
  on public.automation_workflows for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Gatilho de cada automação. Um por workflow nesta fase (índice único),
-- separado em tabela própria para futuras fases poderem associar mais de um
-- gatilho a uma automação sem precisar redesenhar o schema.
-- ----------------------------------------------------------------------------
create table if not exists public.automation_triggers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  workflow_id uuid not null references public.automation_workflows (id) on delete cascade,
  trigger_type text not null check (trigger_type in (
    'lead_created', 'lead_qualified', 'lead_stalled', 'lead_lost', 'client_created'
  )),
  trigger_config jsonb not null default '{}'::jsonb
);

alter table public.automation_triggers enable row level security;

create unique index if not exists automation_triggers_workflow_idx on public.automation_triggers (workflow_id);
create index if not exists automation_triggers_type_idx on public.automation_triggers (trigger_type);

drop trigger if exists set_automation_triggers_updated_at on public.automation_triggers;
create trigger set_automation_triggers_updated_at
  before update on public.automation_triggers
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê automation_triggers" on public.automation_triggers;
create policy "Equipe interna lê automation_triggers"
  on public.automation_triggers for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria automation_triggers" on public.automation_triggers;
create policy "Equipe interna cria automation_triggers"
  on public.automation_triggers for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza automation_triggers" on public.automation_triggers;
create policy "Equipe interna atualiza automation_triggers"
  on public.automation_triggers for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga automation_triggers" on public.automation_triggers;
create policy "Equipe interna apaga automation_triggers"
  on public.automation_triggers for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Histórico de execuções (timeline). Append-only: nenhuma policy de
-- update/delete — o mesmo padrão de conversion_events (Fase 8).
-- ----------------------------------------------------------------------------
create table if not exists public.automation_executions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  workflow_id uuid references public.automation_workflows (id) on delete set null,
  crm_lead_id uuid references public.crm_leads (id) on delete set null,

  trigger_type text not null,
  status text not null check (status in ('sucesso', 'condicao_nao_atendida', 'erro')),
  result_message text,
  duration_ms integer not null default 0,
  event_snapshot jsonb,

  executed_at timestamptz not null default now()
);

alter table public.automation_executions enable row level security;

create index if not exists automation_executions_workflow_idx on public.automation_executions (workflow_id);
create index if not exists automation_executions_lead_idx on public.automation_executions (crm_lead_id);
create index if not exists automation_executions_executed_idx on public.automation_executions (executed_at desc);
create index if not exists automation_executions_status_idx on public.automation_executions (status);

drop policy if exists "Equipe interna lê automation_executions" on public.automation_executions;
create policy "Equipe interna lê automation_executions"
  on public.automation_executions for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria automation_executions" on public.automation_executions;
create policy "Equipe interna cria automation_executions"
  on public.automation_executions for insert
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Log técnico granular, append-only, ligado a uma execução.
-- ----------------------------------------------------------------------------
create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  workflow_id uuid references public.automation_workflows (id) on delete set null,
  execution_id uuid references public.automation_executions (id) on delete cascade,

  level text not null default 'info' check (level in ('info', 'aviso', 'erro')),
  message text not null,
  metadata jsonb
);

alter table public.automation_logs enable row level security;

create index if not exists automation_logs_workflow_idx on public.automation_logs (workflow_id);
create index if not exists automation_logs_execution_idx on public.automation_logs (execution_id);
create index if not exists automation_logs_created_idx on public.automation_logs (created_at desc);

drop policy if exists "Equipe interna lê automation_logs" on public.automation_logs;
create policy "Equipe interna lê automation_logs"
  on public.automation_logs for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria automation_logs" on public.automation_logs;
create policy "Equipe interna cria automation_logs"
  on public.automation_logs for insert
  with check (public.is_internal_staff());

-- ============================================================================
-- Brusync OS — Fase 11: Agenda Comercial.
--
-- Aditivo apenas — nenhuma tabela existente é alterada. Agenda focada na
-- rotina comercial (ligações, reuniões, follow-ups, propostas, implantação),
-- não um calendário genérico: todo evento pode se ligar a um Lead e alimenta
-- a Timeline dele automaticamente (reaproveitando public.crm_lead_activities,
-- já existente — nenhuma coluna nova lá).
--
-- Duas tabelas, um conceito cada:
--   crm_agenda_events → o evento comercial agendado em si (o que popula
--                       "Agenda do dia", "Reuniões", "Follow-ups", etc.).
--   crm_reminders     → lembretes leves, opcionalmente ligados a um evento
--                       ou diretamente a um lead, sem toda a estrutura de
--                       um evento completo.
-- ============================================================================

create table if not exists public.crm_agenda_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  crm_lead_id uuid references public.crm_leads (id) on delete cascade,

  title text not null,
  description text,
  event_type text not null check (event_type in (
    'ligacao', 'reuniao', 'follow_up', 'proposta', 'implantacao', 'outro'
  )),

  scheduled_at timestamptz not null,
  duration_minutes integer,

  status text not null default 'agendado' check (status in ('agendado', 'concluido', 'cancelado')),
  completed_at timestamptz,

  owner_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_agenda_events enable row level security;

create index if not exists crm_agenda_events_lead_idx on public.crm_agenda_events (crm_lead_id);
create index if not exists crm_agenda_events_scheduled_idx on public.crm_agenda_events (scheduled_at);
create index if not exists crm_agenda_events_status_idx on public.crm_agenda_events (status);
create index if not exists crm_agenda_events_owner_idx on public.crm_agenda_events (owner_id);
create index if not exists crm_agenda_events_type_idx on public.crm_agenda_events (event_type);

drop trigger if exists set_crm_agenda_events_updated_at on public.crm_agenda_events;
create trigger set_crm_agenda_events_updated_at
  before update on public.crm_agenda_events
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_agenda_events" on public.crm_agenda_events;
create policy "Equipe interna lê crm_agenda_events"
  on public.crm_agenda_events for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_agenda_events" on public.crm_agenda_events;
create policy "Equipe interna cria crm_agenda_events"
  on public.crm_agenda_events for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_agenda_events" on public.crm_agenda_events;
create policy "Equipe interna atualiza crm_agenda_events"
  on public.crm_agenda_events for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_agenda_events" on public.crm_agenda_events;
create policy "Equipe interna apaga crm_agenda_events"
  on public.crm_agenda_events for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Lembretes leves — podem apontar para um evento (lembrar antes de uma
-- reunião, por exemplo) ou existir sozinhos, ligados apenas a um lead.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_reminders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  crm_lead_id uuid references public.crm_leads (id) on delete cascade,
  agenda_event_id uuid references public.crm_agenda_events (id) on delete cascade,

  message text not null,
  remind_at timestamptz not null,
  status text not null default 'pendente' check (status in ('pendente', 'concluido', 'dispensado')),

  owner_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_reminders enable row level security;

create index if not exists crm_reminders_lead_idx on public.crm_reminders (crm_lead_id);
create index if not exists crm_reminders_event_idx on public.crm_reminders (agenda_event_id);
create index if not exists crm_reminders_remind_at_idx on public.crm_reminders (remind_at);
create index if not exists crm_reminders_status_idx on public.crm_reminders (status);

drop trigger if exists set_crm_reminders_updated_at on public.crm_reminders;
create trigger set_crm_reminders_updated_at
  before update on public.crm_reminders
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_reminders" on public.crm_reminders;
create policy "Equipe interna lê crm_reminders"
  on public.crm_reminders for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_reminders" on public.crm_reminders;
create policy "Equipe interna cria crm_reminders"
  on public.crm_reminders for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_reminders" on public.crm_reminders;
create policy "Equipe interna atualiza crm_reminders"
  on public.crm_reminders for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_reminders" on public.crm_reminders;
create policy "Equipe interna apaga crm_reminders"
  on public.crm_reminders for delete
  using (public.is_internal_staff());

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

-- ============================================================================
-- Brusync OS — Fase 13: Portal do Cliente.
--
-- Aditivo apenas — nenhuma tabela existente é alterada (nem clients, nem
-- profiles, nem as quatro tabelas de crm_projects/_phases/_tasks/_files da
-- Fase 12). O papel "cliente" de profiles.role já existe desde a Fase 1 e já
-- é excluído de is_internal_staff() — este é exatamente o "futuro portal
-- externo" para o qual aquele papel foi reservado.
--
-- Duas tabelas novas, um conceito cada:
--   crm_client_portal_users     → liga um profile (role='cliente') a um
--                                 client_id (empresa), com a permissão
--                                 opcional de enviar arquivos.
--   crm_client_portal_messages  → mensagens de um projeto entre cliente e
--                                 equipe (append-only, como um chat), que
--                                 entram na Timeline computada do projeto.
--
-- Mais uma função de apoio a RLS (current_portal_client_id(), no mesmo
-- espírito de is_internal_staff()) e políticas SELECT/INSERT novas —
-- adicionadas, nunca substituindo as políticas "Equipe interna ..." já
-- existentes — em crm_projects/_phases/_tasks/_files para permitir que um
-- usuário do portal leia (e, quando permitido, envie arquivos para) apenas
-- os projetos do seu próprio client_id.
-- ============================================================================

create table if not exists public.crm_client_portal_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,

  name text,
  can_upload_files boolean not null default false,

  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_client_portal_users enable row level security;

create index if not exists crm_client_portal_users_client_idx
  on public.crm_client_portal_users (client_id);

drop trigger if exists set_crm_client_portal_users_updated_at on public.crm_client_portal_users;
create trigger set_crm_client_portal_users_updated_at
  before update on public.crm_client_portal_users
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_client_portal_users" on public.crm_client_portal_users;
create policy "Equipe interna lê crm_client_portal_users"
  on public.crm_client_portal_users for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_client_portal_users" on public.crm_client_portal_users;
create policy "Equipe interna cria crm_client_portal_users"
  on public.crm_client_portal_users for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_client_portal_users" on public.crm_client_portal_users;
create policy "Equipe interna atualiza crm_client_portal_users"
  on public.crm_client_portal_users for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_client_portal_users" on public.crm_client_portal_users;
create policy "Equipe interna apaga crm_client_portal_users"
  on public.crm_client_portal_users for delete
  using (public.is_internal_staff());

drop policy if exists "Portal cliente lê o próprio acesso" on public.crm_client_portal_users;
create policy "Portal cliente lê o próprio acesso"
  on public.crm_client_portal_users for select
  using (profile_id = auth.uid());

-- ----------------------------------------------------------------------------
-- current_portal_client_id(): o client_id do usuário do portal autenticado,
-- ou null se auth.uid() não for um usuário de portal. security definer para
-- poder ser chamada dentro de outras políticas RLS (mesmo padrão de
-- is_internal_staff()).
-- ----------------------------------------------------------------------------
create or replace function public.current_portal_client_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select client_id
  from public.crm_client_portal_users
  where profile_id = auth.uid()
  limit 1;
$$;

-- ----------------------------------------------------------------------------
-- Leitura do portal em crm_projects/_phases/_tasks/_files — políticas
-- adicionais (permissivas, somadas às "Equipe interna ..." já existentes),
-- nunca substituindo as originais.
-- ----------------------------------------------------------------------------
-- clients também precisa de uma política de leitura para o portal: sem ela,
-- o join embutido client:clients!crm_client_portal_users_client_id_fkey(company)
-- em getPortalAccessForCurrentUser volta null sob RLS (PostgREST simplesmente
-- omite o recurso relacionado que a política não permite ler), não um erro —
-- por isso é fácil esquecer. Só o próprio client_id do usuário do portal.
drop policy if exists "Portal cliente lê clients" on public.clients;
create policy "Portal cliente lê clients"
  on public.clients for select
  using (id = public.current_portal_client_id());

drop policy if exists "Portal cliente lê crm_projects" on public.crm_projects;
create policy "Portal cliente lê crm_projects"
  on public.crm_projects for select
  using (client_id = public.current_portal_client_id());

drop policy if exists "Portal cliente lê crm_project_phases" on public.crm_project_phases;
create policy "Portal cliente lê crm_project_phases"
  on public.crm_project_phases for select
  using (
    exists (
      select 1 from public.crm_projects p
      where p.id = crm_project_phases.project_id
        and p.client_id = public.current_portal_client_id()
    )
  );

drop policy if exists "Portal cliente lê crm_project_tasks" on public.crm_project_tasks;
create policy "Portal cliente lê crm_project_tasks"
  on public.crm_project_tasks for select
  using (
    exists (
      select 1 from public.crm_projects p
      where p.id = crm_project_tasks.project_id
        and p.client_id = public.current_portal_client_id()
    )
  );

drop policy if exists "Portal cliente lê crm_project_files" on public.crm_project_files;
create policy "Portal cliente lê crm_project_files"
  on public.crm_project_files for select
  using (
    exists (
      select 1 from public.crm_projects p
      where p.id = crm_project_files.project_id
        and p.client_id = public.current_portal_client_id()
    )
  );

-- Upload pelo portal só quando crm_client_portal_users.can_upload_files é
-- true para o projeto do próprio client_id — "Upload opcional apenas quando
-- permitido".
drop policy if exists "Portal cliente envia crm_project_files" on public.crm_project_files;
create policy "Portal cliente envia crm_project_files"
  on public.crm_project_files for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.crm_projects p
      join public.crm_client_portal_users cpu on cpu.client_id = p.client_id
      where p.id = crm_project_files.project_id
        and cpu.profile_id = auth.uid()
        and cpu.can_upload_files = true
    )
  );

-- profiles só tem uma política hoje ("Usuários podem ver o próprio perfil",
-- auth.uid() = id) — sem esta, os joins embutidos
-- owner:profiles!crm_projects_owner_id_fkey, assignee:profiles!..., e
-- uploader:profiles!... (repositories/projects/*Repository.ts, reaproveitados
-- tal como estão pelo portal) voltariam null para o nome de QUALQUER membro
-- da equipe que não seja o próprio usuário do portal — silenciosamente, sem
-- erro, exatamente como o bug de clients acima. Escopo: só perfis de quem
-- é owner/created_by de um projeto, assignee de uma tarefa, ou uploader de
-- um arquivo — sempre dentro de um projeto do próprio client_id do portal.
drop policy if exists "Portal cliente lê perfis da equipe em seus projetos" on public.profiles;
create policy "Portal cliente lê perfis da equipe em seus projetos"
  on public.profiles for select
  using (
    exists (
      select 1 from public.crm_projects p
      where p.client_id = public.current_portal_client_id()
        and (p.owner_id = profiles.id or p.created_by = profiles.id)
    )
    or exists (
      select 1 from public.crm_project_tasks t
      join public.crm_projects p on p.id = t.project_id
      where p.client_id = public.current_portal_client_id()
        and t.assignee_id = profiles.id
    )
    or exists (
      select 1 from public.crm_project_files f
      join public.crm_projects p on p.id = f.project_id
      where p.client_id = public.current_portal_client_id()
        and f.uploaded_by = profiles.id
    )
  );

-- ----------------------------------------------------------------------------
-- Mensagens do projeto: cliente comenta, equipe responde, tudo aparece na
-- Timeline computada (domain/clientPortal/timeline.ts mescla estas linhas
-- com domain/projects/timeline.ts). Append-only — sem update/delete policy,
-- mesmo padrão de crm_lead_activities.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_client_portal_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  project_id uuid not null references public.crm_projects (id) on delete cascade,
  author_type text not null check (author_type in ('cliente', 'equipe')),
  author_profile_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  body text not null
);

alter table public.crm_client_portal_messages enable row level security;

create index if not exists crm_client_portal_messages_project_idx
  on public.crm_client_portal_messages (project_id, created_at);

drop policy if exists "Equipe interna lê crm_client_portal_messages" on public.crm_client_portal_messages;
create policy "Equipe interna lê crm_client_portal_messages"
  on public.crm_client_portal_messages for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna responde crm_client_portal_messages" on public.crm_client_portal_messages;
create policy "Equipe interna responde crm_client_portal_messages"
  on public.crm_client_portal_messages for insert
  with check (
    public.is_internal_staff()
    and author_type = 'equipe'
    and author_profile_id = auth.uid()
  );

drop policy if exists "Portal cliente lê crm_client_portal_messages" on public.crm_client_portal_messages;
create policy "Portal cliente lê crm_client_portal_messages"
  on public.crm_client_portal_messages for select
  using (
    exists (
      select 1 from public.crm_projects p
      where p.id = crm_client_portal_messages.project_id
        and p.client_id = public.current_portal_client_id()
    )
  );
drop policy if exists "Portal cliente comenta crm_client_portal_messages" on public.crm_client_portal_messages;
create policy "Portal cliente comenta crm_client_portal_messages"
  on public.crm_client_portal_messages for insert
  with check (
    author_type = 'cliente'
    and author_profile_id = auth.uid()
    and exists (
      select 1 from public.crm_projects p
      where p.id = crm_client_portal_messages.project_id
        and p.client_id = public.current_portal_client_id()
    )
  );

-- ----------------------------------------------------------------------------
-- Storage: o portal reaproveita o bucket privado crm-project-files da Fase
-- 12 (nunca um bucket novo/duplicado). storage_path é sempre
-- "{project_id}/{uuid}-{nome}" (repositories/projects/projectFilesRepository
-- .ts), então storage.foldername(name) já dá o project_id sem precisar de
-- nenhuma coluna nova em storage.objects.
-- ----------------------------------------------------------------------------
drop policy if exists "Portal cliente lê arquivos crm-project-files" on storage.objects;
create policy "Portal cliente lê arquivos crm-project-files"
  on storage.objects for select
  using (
    bucket_id = 'crm-project-files'
    and exists (
      select 1 from public.crm_projects p
      where p.id::text = (storage.foldername(storage.objects.name))[1]
        and p.client_id = public.current_portal_client_id()
    )
  );

drop policy if exists "Portal cliente envia arquivos crm-project-files" on storage.objects;
create policy "Portal cliente envia arquivos crm-project-files"
  on storage.objects for insert
  with check (
    bucket_id = 'crm-project-files'
    and exists (
      select 1 from public.crm_projects p
      join public.crm_client_portal_users cpu on cpu.client_id = p.client_id
      where p.id::text = (storage.foldername(storage.objects.name))[1]
        and cpu.profile_id = auth.uid()
        and cpu.can_upload_files = true
    )
  );

-- ============================================================================
-- Brusync OS — Fase 14: Financeiro.
--
-- Aditivo apenas — nenhuma tabela existente é alterada (clients, crm_projects,
-- crm_leads, conversion_events, marketing_campaign_spend permanecem intactas).
-- Não é um ERP contábil: dá visão financeira da operação comercial já
-- registrada no CRM, ligando Lead → Cliente → Projeto → Receita.
--
-- Cinco tabelas, um conceito cada:
--   crm_financial_accounts      → onde o dinheiro está (Caixa, Banco X).
--   crm_financial_categories    → categorias de receita/despesa (com
--                                 seed padrão para despesas).
--   crm_financial_transactions  → o lançamento em si (receita ou despesa),
--                                 ligado opcionalmente a client_id/project_id/
--                                 crm_lead_id/conversion_event_id — é esse
--                                 vínculo que dá "Vincular automaticamente:
--                                 Cliente, Projeto, Lead original, Campanha,
--                                 UTMs, Conversão" (campanha/UTMs vêm de
--                                 conversion_events, que já as carrega).
--   crm_financial_installments  → parcelas de um lançamento (parcelamento,
--                                 pagamento parcial, reabertura).
--   crm_financial_documents     → anexos (contrato/nota/comprovante/recibo),
--                                 mesmo padrão de crm_project_files —
--                                 bucket Storage privado próprio.
--
-- "Valor contratado"/"Valor recebido"/"Saldo restante" de um Projeto (e o
-- resumo financeiro de um Cliente) são computados a partir dos lançamentos
-- ligados a project_id/client_id, nunca uma coluna nova em crm_projects ou
-- clients — mesmo raciocínio da Timeline computada da Fase 12.
--
-- O Portal do Cliente enxerga apenas as RECEITAS do seu próprio client_id
-- (nunca despesas) via a mesma current_portal_client_id() da Fase 13.
-- ============================================================================

create table if not exists public.crm_financial_accounts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  type text not null default 'banco' check (type in ('caixa', 'banco', 'outro')),

  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_financial_accounts enable row level security;

drop trigger if exists set_crm_financial_accounts_updated_at on public.crm_financial_accounts;
create trigger set_crm_financial_accounts_updated_at
  before update on public.crm_financial_accounts
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_financial_accounts" on public.crm_financial_accounts;
create policy "Equipe interna lê crm_financial_accounts"
  on public.crm_financial_accounts for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_financial_accounts" on public.crm_financial_accounts;
create policy "Equipe interna cria crm_financial_accounts"
  on public.crm_financial_accounts for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_financial_accounts" on public.crm_financial_accounts;
create policy "Equipe interna atualiza crm_financial_accounts"
  on public.crm_financial_accounts for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_financial_accounts" on public.crm_financial_accounts;
create policy "Equipe interna apaga crm_financial_accounts"
  on public.crm_financial_accounts for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
create table if not exists public.crm_financial_categories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  name text not null,
  kind text not null check (kind in ('receita', 'despesa')),
  is_default boolean not null default false
);

alter table public.crm_financial_categories enable row level security;

create unique index if not exists crm_financial_categories_name_kind_idx
  on public.crm_financial_categories (kind, name);

drop policy if exists "Equipe interna lê crm_financial_categories" on public.crm_financial_categories;
create policy "Equipe interna lê crm_financial_categories"
  on public.crm_financial_categories for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_financial_categories" on public.crm_financial_categories;
create policy "Equipe interna cria crm_financial_categories"
  on public.crm_financial_categories for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_financial_categories" on public.crm_financial_categories;
create policy "Equipe interna apaga crm_financial_categories"
  on public.crm_financial_categories for delete
  using (public.is_internal_staff() and not is_default);

insert into public.crm_financial_categories (name, kind, is_default) values
  ('Impostos', 'despesa', true),
  ('Infraestrutura', 'despesa', true),
  ('Marketing', 'despesa', true),
  ('Terceiros', 'despesa', true),
  ('Software', 'despesa', true),
  ('Salários', 'despesa', true),
  ('Outros', 'despesa', true),
  ('Receita de projeto', 'receita', true),
  ('Outras receitas', 'receita', true)
on conflict (kind, name) do nothing;

-- ----------------------------------------------------------------------------
create table if not exists public.crm_financial_transactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  kind text not null check (kind in ('receita', 'despesa')),
  status text not null default 'previsto'
    check (status in ('previsto', 'pago', 'parcial', 'vencido', 'cancelado')),

  description text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  due_date timestamptz,
  paid_at timestamptz,

  account_id uuid references public.crm_financial_accounts (id) on delete set null,
  category_id uuid references public.crm_financial_categories (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  project_id uuid references public.crm_projects (id) on delete set null,
  crm_lead_id uuid references public.crm_leads (id) on delete set null,
  conversion_event_id uuid references public.conversion_events (id) on delete set null,

  supplier text,
  cost_center text,
  installments_count integer not null default 1 check (installments_count >= 1),

  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_financial_transactions enable row level security;

create index if not exists crm_financial_transactions_kind_idx on public.crm_financial_transactions (kind);
create index if not exists crm_financial_transactions_status_idx on public.crm_financial_transactions (status);
create index if not exists crm_financial_transactions_client_idx on public.crm_financial_transactions (client_id);
create index if not exists crm_financial_transactions_project_idx on public.crm_financial_transactions (project_id);
create index if not exists crm_financial_transactions_due_idx on public.crm_financial_transactions (due_date);

drop trigger if exists set_crm_financial_transactions_updated_at on public.crm_financial_transactions;
create trigger set_crm_financial_transactions_updated_at
  before update on public.crm_financial_transactions
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_financial_transactions" on public.crm_financial_transactions;
create policy "Equipe interna lê crm_financial_transactions"
  on public.crm_financial_transactions for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_financial_transactions" on public.crm_financial_transactions;
create policy "Equipe interna cria crm_financial_transactions"
  on public.crm_financial_transactions for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_financial_transactions" on public.crm_financial_transactions;
create policy "Equipe interna atualiza crm_financial_transactions"
  on public.crm_financial_transactions for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_financial_transactions" on public.crm_financial_transactions;
create policy "Equipe interna apaga crm_financial_transactions"
  on public.crm_financial_transactions for delete
  using (public.is_internal_staff());

-- Portal do Cliente: só as próprias RECEITAS, nunca despesas — mesma
-- current_portal_client_id() da Fase 13, política somada às acima.
drop policy if exists "Portal cliente lê receitas crm_financial_transactions" on public.crm_financial_transactions;
create policy "Portal cliente lê receitas crm_financial_transactions"
  on public.crm_financial_transactions for select
  using (kind = 'receita' and client_id = public.current_portal_client_id());

-- ----------------------------------------------------------------------------
create table if not exists public.crm_financial_installments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  transaction_id uuid not null references public.crm_financial_transactions (id) on delete cascade,
  installment_number integer not null,
  amount numeric(14, 2) not null check (amount >= 0),
  due_date timestamptz not null,
  paid_at timestamptz,
  status text not null default 'pendente'
    check (status in ('pendente', 'pago', 'parcial', 'vencido', 'cancelado'))
);

alter table public.crm_financial_installments enable row level security;

create index if not exists crm_financial_installments_transaction_idx
  on public.crm_financial_installments (transaction_id, installment_number);

drop trigger if exists set_crm_financial_installments_updated_at on public.crm_financial_installments;
create trigger set_crm_financial_installments_updated_at
  before update on public.crm_financial_installments
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_financial_installments" on public.crm_financial_installments;
create policy "Equipe interna lê crm_financial_installments"
  on public.crm_financial_installments for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_financial_installments" on public.crm_financial_installments;
create policy "Equipe interna cria crm_financial_installments"
  on public.crm_financial_installments for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_financial_installments" on public.crm_financial_installments;
create policy "Equipe interna atualiza crm_financial_installments"
  on public.crm_financial_installments for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_financial_installments" on public.crm_financial_installments;
create policy "Equipe interna apaga crm_financial_installments"
  on public.crm_financial_installments for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Documentos: só metadados aqui, binário no bucket Storage privado
-- crm-financial-documents (criado abaixo) — mesmo padrão de crm_project_files.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_financial_documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  transaction_id uuid not null references public.crm_financial_transactions (id) on delete cascade,
  document_type text not null default 'outro'
    check (document_type in ('contrato', 'nota', 'comprovante', 'recibo', 'outro')),

  storage_path text not null,
  file_name text not null,
  file_size integer,
  mime_type text,
  uploaded_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_financial_documents enable row level security;

create index if not exists crm_financial_documents_transaction_idx
  on public.crm_financial_documents (transaction_id);

drop policy if exists "Equipe interna lê crm_financial_documents" on public.crm_financial_documents;
create policy "Equipe interna lê crm_financial_documents"
  on public.crm_financial_documents for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_financial_documents" on public.crm_financial_documents;
create policy "Equipe interna cria crm_financial_documents"
  on public.crm_financial_documents for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_financial_documents" on public.crm_financial_documents;
create policy "Equipe interna apaga crm_financial_documents"
  on public.crm_financial_documents for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Bucket Storage privado para os documentos financeiros — mesmo padrão do
-- crm-project-files (Fase 12): sem policy de update, acesso só por
-- is_internal_staff().
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('crm-financial-documents', 'crm-financial-documents', false)
on conflict (id) do nothing;

drop policy if exists "Equipe interna lê arquivos crm-financial-documents" on storage.objects;
create policy "Equipe interna lê arquivos crm-financial-documents"
  on storage.objects for select
  using (bucket_id = 'crm-financial-documents' and public.is_internal_staff());
drop policy if exists "Equipe interna envia arquivos crm-financial-documents" on storage.objects;
create policy "Equipe interna envia arquivos crm-financial-documents"
  on storage.objects for insert
  with check (bucket_id = 'crm-financial-documents' and public.is_internal_staff());
drop policy if exists "Equipe interna apaga arquivos crm-financial-documents" on storage.objects;
create policy "Equipe interna apaga arquivos crm-financial-documents"
  on storage.objects for delete
  using (bucket_id = 'crm-financial-documents' and public.is_internal_staff());


-- ============================================================================
-- Brusync OS — Fase 15: Central de Comunicação.
--
-- Aditivo apenas — nenhuma tabela existente é alterada, exceto a extensão
-- (já precedente desde a Fase 3) da constraint de tipos de
-- crm_lead_activities, para que "Mensagem enviada/recebida", "Conversa
-- iniciada/encerrada" e "Responsável alterado" apareçam na Timeline do Lead
-- exatamente como qualquer outro evento do CRM.
--
-- Esta fase NÃO integra nenhuma API real (WhatsApp, Meta, Evolution API
-- etc.) — apenas prepara a arquitetura e o schema para recebê-las depois,
-- sem precisar refatorar nenhuma tela. Por isso toda mensagem hoje é
-- inserida manualmente (enviada pelo atendente ou registrada como recebida).
--
-- Cinco tabelas, um conceito cada:
--   crm_channels             → canais possíveis (WhatsApp, WhatsApp Business
--                              Cloud API, Evolution API, Messenger, Instagram
--                              Direct, E-mail, Telefone, Chat interno),
--                              seedados como configuração, não como enum
--                              fixo no código — uma futura integração real só
--                              precisa ativar/configurar a linha existente.
--   crm_conversations        → uma conversa, sempre ligada a um Lead OU um
--                              Cliente (nunca nenhum dos dois, nunca ambos
--                              obrigatoriamente — mas ao menos um).
--   crm_messages             → mensagens de uma conversa (inbound/outbound).
--   crm_message_templates    → modelos de mensagem reutilizáveis no composer.
--   crm_message_events       → log append-only de eventos da conversa
--                              (iniciada, encerrada, responsável alterado,
--                              mensagem enviada/recebida) — histórico da
--                              própria conversa, complementar (não substitui)
--                              à Timeline geral do Lead.
-- ============================================================================

create table if not exists public.crm_channels (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  type text not null check (type in (
    'whatsapp', 'whatsapp_business_api', 'evolution_api', 'messenger',
    'instagram_direct', 'email', 'phone', 'internal', 'outro'
  )),
  name text not null,
  is_active boolean not null default true
);

alter table public.crm_channels enable row level security;

create unique index if not exists crm_channels_type_name_idx on public.crm_channels (type, name);

drop policy if exists "Equipe interna lê crm_channels" on public.crm_channels;
create policy "Equipe interna lê crm_channels"
  on public.crm_channels for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_channels" on public.crm_channels;
create policy "Equipe interna cria crm_channels"
  on public.crm_channels for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_channels" on public.crm_channels;
create policy "Equipe interna atualiza crm_channels"
  on public.crm_channels for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_channels" on public.crm_channels;
create policy "Equipe interna apaga crm_channels"
  on public.crm_channels for delete
  using (public.is_internal_staff());

insert into public.crm_channels (type, name) values
  ('whatsapp', 'WhatsApp'),
  ('whatsapp_business_api', 'WhatsApp Business Cloud API'),
  ('evolution_api', 'Evolution API'),
  ('messenger', 'Messenger'),
  ('instagram_direct', 'Instagram Direct'),
  ('email', 'E-mail'),
  ('phone', 'Telefone'),
  ('internal', 'Chat interno')
on conflict (type, name) do nothing;

-- ----------------------------------------------------------------------------
create table if not exists public.crm_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  channel_id uuid not null references public.crm_channels (id),
  crm_lead_id uuid references public.crm_leads (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,

  owner_id uuid references public.profiles (id) on delete set null,
  status text not null default 'aberta' check (status in ('aberta', 'pendente', 'encerrada')),
  is_favorite boolean not null default false,
  is_archived boolean not null default false,

  contact_name text,
  contact_handle text,

  last_message_at timestamptz,
  last_message_preview text,
  last_message_direction text check (last_message_direction in ('inbound', 'outbound')),
  unread_count integer not null default 0,

  created_by uuid references public.profiles (id) on delete set null,

  constraint crm_conversations_subject_check check (crm_lead_id is not null or client_id is not null)
);

alter table public.crm_conversations enable row level security;

create index if not exists crm_conversations_lead_idx on public.crm_conversations (crm_lead_id);
create index if not exists crm_conversations_client_idx on public.crm_conversations (client_id);
create index if not exists crm_conversations_owner_idx on public.crm_conversations (owner_id);
create index if not exists crm_conversations_channel_idx on public.crm_conversations (channel_id);
create index if not exists crm_conversations_status_idx on public.crm_conversations (status);
create index if not exists crm_conversations_last_message_idx
  on public.crm_conversations (last_message_at desc nulls last);

drop trigger if exists set_crm_conversations_updated_at on public.crm_conversations;
create trigger set_crm_conversations_updated_at
  before update on public.crm_conversations
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_conversations" on public.crm_conversations;
create policy "Equipe interna lê crm_conversations"
  on public.crm_conversations for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_conversations" on public.crm_conversations;
create policy "Equipe interna cria crm_conversations"
  on public.crm_conversations for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_conversations" on public.crm_conversations;
create policy "Equipe interna atualiza crm_conversations"
  on public.crm_conversations for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_conversations" on public.crm_conversations;
create policy "Equipe interna apaga crm_conversations"
  on public.crm_conversations for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
create table if not exists public.crm_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  conversation_id uuid not null references public.crm_conversations (id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,

  sender_profile_id uuid references public.profiles (id) on delete set null,
  sender_name text,

  metadata jsonb
);

alter table public.crm_messages enable row level security;

create index if not exists crm_messages_conversation_idx
  on public.crm_messages (conversation_id, created_at);

drop policy if exists "Equipe interna lê crm_messages" on public.crm_messages;
create policy "Equipe interna lê crm_messages"
  on public.crm_messages for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_messages" on public.crm_messages;
create policy "Equipe interna cria crm_messages"
  on public.crm_messages for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_messages" on public.crm_messages;
create policy "Equipe interna apaga crm_messages"
  on public.crm_messages for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
create table if not exists public.crm_message_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  body text not null,
  channel_type text check (channel_type in (
    'whatsapp', 'whatsapp_business_api', 'evolution_api', 'messenger',
    'instagram_direct', 'email', 'phone', 'internal', 'outro'
  )),

  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_message_templates enable row level security;

drop trigger if exists set_crm_message_templates_updated_at on public.crm_message_templates;
create trigger set_crm_message_templates_updated_at
  before update on public.crm_message_templates
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_message_templates" on public.crm_message_templates;
create policy "Equipe interna lê crm_message_templates"
  on public.crm_message_templates for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_message_templates" on public.crm_message_templates;
create policy "Equipe interna cria crm_message_templates"
  on public.crm_message_templates for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_message_templates" on public.crm_message_templates;
create policy "Equipe interna atualiza crm_message_templates"
  on public.crm_message_templates for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_message_templates" on public.crm_message_templates;
create policy "Equipe interna apaga crm_message_templates"
  on public.crm_message_templates for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Somente leitura e inserção — nunca update, nunca delete, mesmo padrão de
-- crm_lead_journey_events: o histórico de uma conversa nunca pode ser
-- reescrito.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_message_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  conversation_id uuid not null references public.crm_conversations (id) on delete cascade,
  type text not null check (type in (
    'conversation_started', 'conversation_closed', 'conversation_reopened',
    'message_sent', 'message_received', 'owner_changed', 'status_changed',
    'favorited', 'unfavorited', 'archived', 'unarchived'
  )),
  actor_id uuid references public.profiles (id) on delete set null,
  metadata jsonb
);

alter table public.crm_message_events enable row level security;

create index if not exists crm_message_events_conversation_idx
  on public.crm_message_events (conversation_id, created_at);

drop policy if exists "Equipe interna lê crm_message_events" on public.crm_message_events;
create policy "Equipe interna lê crm_message_events"
  on public.crm_message_events for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_message_events" on public.crm_message_events;
create policy "Equipe interna cria crm_message_events"
  on public.crm_message_events for insert
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Extensão aditiva da Timeline geral do Lead (mesmo mecanismo já usado nas
-- Fases 3/5/12): toda interação de uma conversa ligada a um Lead também
-- aparece na Timeline do Lead Workspace, ao lado dos demais eventos do CRM.
-- ----------------------------------------------------------------------------
alter table public.crm_lead_activities drop constraint if exists crm_lead_activities_type_check;
alter table public.crm_lead_activities add constraint crm_lead_activities_type_check
  check (type in (
    'note', 'stage_change', 'call', 'email', 'meeting', 'task', 'system',
    'lead_updated', 'owner_change',
    'note_created', 'note_updated', 'note_deleted',
    'task_created', 'task_updated', 'task_completed', 'task_deleted',
    'file_upload', 'file_delete',
    'automation', 'lead_lost', 'lead_reopened', 'client_created',
    'conversation_started', 'conversation_closed',
    'message_sent', 'message_received', 'conversation_owner_changed'
  ));


-- ============================================================================
-- Brusync OS — Fase 16: Central de Integrações.
--
-- Aditivo apenas, evoluindo o módulo de Integrações já existente desde a
-- Fase 9 (public.integrations/integration_logs/integration_events e o board/
-- drawer em app/(crm)/(app)/integracoes) em vez de duplicá-lo — a própria
-- Fase 16 pede "nenhuma configuração espalhada pelo sistema", e um catálogo
-- paralelo seria exatamente isso. Nenhuma tabela nova é criada aqui.
--
-- Duas mudanças de dado, ambas seguras de rodar de novo:
--   1) Recategoriza linhas existentes para o vocabulário de categorias da
--      Fase 16 (Marketing/Comunicação/Automação/IA/Infraestrutura) — mantém
--      "analytics" e "developer" para os poucos providers que não couberam
--      em nenhuma das 5 categorias pedidas (Search Console, Clarity, API,
--      SDK), sem removê-los do catálogo.
--   2) Insere as 12 novas linhas de catálogo pedidas pela Fase 16 (Evolution
--      API, Messenger, Instagram Direct, E-mail SMTP, Resend, SendGrid,
--      OpenAI, Claude, Gemini, Supabase, Storage, Vercel) — todas
--      'em_desenvolvimento', desabilitadas, sem nenhuma credencial real,
--      mesmo padrão do seed original da Fase 9.
-- ============================================================================

alter table public.integrations drop constraint if exists integrations_category_check;

update public.integrations set category = 'marketing'
  where provider in ('meta_ads', 'google_ads', 'tiktok_ads', 'linkedin_ads', 'microsoft_ads', 'ga4', 'gtm');

update public.integrations set category = 'automacao'
  where provider = 'webhook';

alter table public.integrations add constraint integrations_category_check
  check (category in (
    'marketing', 'analytics', 'comunicacao', 'automacao', 'ia', 'infraestrutura', 'developer'
  ));

update public.integrations
  set description = 'Envie e receba mensagens de leads e clientes pelo WhatsApp Business.'
  where provider = 'whatsapp';

insert into public.integrations (provider, category, name, description, status, enabled)
values
  ('evolution_api', 'comunicacao', 'Evolution API', 'Conecte um número de WhatsApp via gateway self-hosted Evolution API.', 'em_desenvolvimento', false),
  ('messenger', 'comunicacao', 'Messenger', 'Receba e responda mensagens do Facebook Messenger na Central de Comunicação.', 'em_desenvolvimento', false),
  ('instagram_direct', 'comunicacao', 'Instagram Direct', 'Receba e responda mensagens diretas do Instagram na Central de Comunicação.', 'em_desenvolvimento', false),
  ('smtp', 'comunicacao', 'E-mail SMTP', 'Envie e-mails transacionais e de notificação por um servidor SMTP próprio.', 'em_desenvolvimento', false),
  ('resend', 'comunicacao', 'Resend', 'Envie e-mails transacionais através da API do Resend.', 'em_desenvolvimento', false),
  ('sendgrid', 'comunicacao', 'SendGrid', 'Envie e-mails transacionais e de marketing através do SendGrid.', 'em_desenvolvimento', false),
  ('openai', 'ia', 'OpenAI', 'Utilize modelos da OpenAI para recursos de inteligência artificial do Brusync.', 'em_desenvolvimento', false),
  ('claude', 'ia', 'Claude', 'Utilize modelos Claude (Anthropic) para recursos de inteligência artificial.', 'em_desenvolvimento', false),
  ('gemini', 'ia', 'Gemini', 'Utilize modelos Gemini (Google) para recursos de inteligência artificial.', 'em_desenvolvimento', false),
  ('supabase', 'infraestrutura', 'Supabase', 'Banco de dados e autenticação — infraestrutura principal do Brusync OS.', 'em_desenvolvimento', false),
  ('storage', 'infraestrutura', 'Storage', 'Armazenamento de arquivos e documentos anexados no Brusync OS.', 'em_desenvolvimento', false),
  ('vercel', 'infraestrutura', 'Vercel', 'Hospedagem e deploy da aplicação web do Brusync OS.', 'em_desenvolvimento', false)
on conflict (provider) do nothing;
