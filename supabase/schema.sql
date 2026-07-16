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
