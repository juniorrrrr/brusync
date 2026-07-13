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
