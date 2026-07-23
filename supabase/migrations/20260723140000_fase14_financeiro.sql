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

-- Portal do Cliente: as parcelas são a fonte real de "quanto já foi pago"
-- (ver domain/financial/calculations.ts) — sem esta política, o resumo
-- financeiro do Portal (Valor recebido/Saldo/Percentual) vinha sempre
-- zerado, mesmo com a política de crm_financial_transactions já liberando
-- a receita em si; mesma classe de bug do join silenciosamente vazio já
-- corrigido na Fase 13. Só parcelas de receitas do próprio client_id.
drop policy if exists "Portal cliente lê crm_financial_installments" on public.crm_financial_installments;
create policy "Portal cliente lê crm_financial_installments"
  on public.crm_financial_installments for select
  using (
    exists (
      select 1 from public.crm_financial_transactions t
      where t.id = crm_financial_installments.transaction_id
        and t.kind = 'receita'
        and t.client_id = public.current_portal_client_id()
    )
  );

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
