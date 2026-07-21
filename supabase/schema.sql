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
