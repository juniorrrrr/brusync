-- ============================================================================
-- Brusync OS — Fase 18: Base de Conhecimento (Knowledge Center).
--
-- Aditivo apenas — nenhuma tabela existente é alterada. Nove tabelas, cada
-- uma com um papel único:
--
--   crm_knowledge_categories     → organização da Biblioteca (Comercial,
--                                  Marketing, Financeiro, Projetos, Operação,
--                                  RH, Tecnologia, Jurídico, Treinamentos +
--                                  categorias personalizadas).
--   crm_knowledge_documents      → o documento em si — conteúdo ATUAL vive
--                                  em content_json (array de blocos do
--                                  editor); content_text é texto puro
--                                  extraído dos blocos pela camada de
--                                  aplicação só para alimentar a busca.
--   crm_knowledge_versions       → snapshot imutável a cada alteração
--                                  publicada — nenhuma edição sobrescreve a
--                                  anterior, sempre uma linha nova aqui
--                                  antes do update em crm_knowledge_documents
--                                  (mesmo raciocínio de nunca perder histórico
--                                  já usado na Timeline computada da Fase 12).
--   crm_knowledge_tags           → vocabulário de tags, reutilizável entre
--                                  documentos (m:n via document_tags).
--   crm_knowledge_document_tags  → junção document <-> tag.
--   crm_knowledge_files          → anexos/arquivos da Biblioteca de Arquivos;
--                                  só metadados aqui, binário no bucket
--                                  Storage privado crm-knowledge-files
--                                  (mesmo padrão de crm_project_files e
--                                  crm_financial_documents). document_id
--                                  nulo = arquivo solto na Biblioteca de
--                                  Arquivos, ainda não anexado a um
--                                  documento.
--   crm_knowledge_favorites      → favoritar/fixar é por usuário — cada
--                                  profile tem sua própria linha por
--                                  documento (unique document_id+user_id).
--   crm_knowledge_views          → histórico de "quem visualizou" (action=
--                                  'view') e "quem baixou arquivo" (action=
--                                  'download', file_id preenchido) — as duas
--                                  pontas do Histórico que não já são
--                                  cobertas por versions (quem editou/
--                                  restaurou) e por documents.published_by
--                                  (quem publicou). view_count nunca é uma
--                                  coluna redundante em documents — é sempre
--                                  count(*) desta tabela, mesmo raciocínio do
--                                  "nunca uma coluna nova" da Fase 14.
--   crm_knowledge_permissions    → override fino por documento ou categoria,
--                                  por perfil específico ou por role inteira
--                                  (can_view/edit/delete/publish/approve/
--                                  duplicate/favorite). É uma camada de
--                                  CONFIGURAÇÃO lida pela aplicação — RLS em
--                                  si continua gateada por is_internal_staff()
--                                  em todas as tabelas, mesmo modelo usado no
--                                  resto do sistema (nenhum outro módulo tem
--                                  RLS por linha própria de usuário além do
--                                  Portal do Cliente).
--
-- Vínculos de negócio (sem duplicar informação, só referência): Lead,
-- Cliente, Projeto, Conversa, Automação, Integração e Financeiro — todos
-- nullable em crm_knowledge_documents, igual ao padrão já usado em
-- crm_financial_transactions.
--
-- Este módulo é só estrutura de conteúdo — nenhuma IA nesta fase. As colunas
-- content_text/search_vector já preparam a Busca Global e uma futura busca
-- semântica, mas nenhuma chamada a modelo é feita aqui.
-- ============================================================================

-- ----------------------------------------------------------------------------
create table if not exists public.crm_knowledge_categories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  slug text not null,
  description text,
  icon text not null default 'doc',
  color text not null default 'neutral' check (color in ('info', 'warn', 'ok', 'neutral', 'danger')),
  is_default boolean not null default false,
  sort_order integer not null default 0,

  created_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

alter table public.crm_knowledge_categories enable row level security;

create unique index if not exists crm_knowledge_categories_slug_idx
  on public.crm_knowledge_categories (slug) where deleted_at is null;

drop trigger if exists set_crm_knowledge_categories_updated_at on public.crm_knowledge_categories;
create trigger set_crm_knowledge_categories_updated_at
  before update on public.crm_knowledge_categories
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_knowledge_categories" on public.crm_knowledge_categories;
create policy "Equipe interna lê crm_knowledge_categories"
  on public.crm_knowledge_categories for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_knowledge_categories" on public.crm_knowledge_categories;
create policy "Equipe interna cria crm_knowledge_categories"
  on public.crm_knowledge_categories for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_knowledge_categories" on public.crm_knowledge_categories;
create policy "Equipe interna atualiza crm_knowledge_categories"
  on public.crm_knowledge_categories for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_knowledge_categories" on public.crm_knowledge_categories;
create policy "Equipe interna apaga crm_knowledge_categories"
  on public.crm_knowledge_categories for delete
  using (public.is_internal_staff() and not is_default);

insert into public.crm_knowledge_categories (name, slug, icon, color, is_default, sort_order) values
  ('Comercial', 'comercial', 'target', 'info', true, 1),
  ('Marketing', 'marketing', 'report', 'warn', true, 2),
  ('Financeiro', 'financeiro', 'wallet', 'ok', true, 3),
  ('Projetos', 'projetos', 'doc', 'info', true, 4),
  ('Operação', 'operacao', 'bolt', 'neutral', true, 5),
  ('RH', 'rh', 'users', 'neutral', true, 6),
  ('Tecnologia', 'tecnologia', 'server', 'neutral', true, 7),
  ('Jurídico', 'juridico', 'lock', 'danger', true, 8),
  ('Treinamentos', 'treinamentos', 'book', 'ok', true, 9)
on conflict do nothing;

-- ----------------------------------------------------------------------------
create table if not exists public.crm_knowledge_tags (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  name text not null,
  slug text not null,

  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_knowledge_tags enable row level security;

create unique index if not exists crm_knowledge_tags_slug_idx on public.crm_knowledge_tags (slug);

drop policy if exists "Equipe interna lê crm_knowledge_tags" on public.crm_knowledge_tags;
create policy "Equipe interna lê crm_knowledge_tags"
  on public.crm_knowledge_tags for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_knowledge_tags" on public.crm_knowledge_tags;
create policy "Equipe interna cria crm_knowledge_tags"
  on public.crm_knowledge_tags for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_knowledge_tags" on public.crm_knowledge_tags;
create policy "Equipe interna apaga crm_knowledge_tags"
  on public.crm_knowledge_tags for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
create table if not exists public.crm_knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  category_id uuid references public.crm_knowledge_categories (id) on delete set null,
  title text not null,
  slug text not null,
  content_type text not null default 'documento'
    check (content_type in (
      'documento', 'playbook', 'checklist', 'faq', 'procedimento', 'politica',
      'treinamento', 'script_comercial', 'template', 'contrato', 'arquivo',
      'link_externo', 'video'
    )),
  status text not null default 'rascunho'
    check (status in ('rascunho', 'em_revisao', 'publicado', 'arquivado')),

  content_json jsonb not null default '[]'::jsonb,
  content_text text not null default '',
  summary text,
  external_url text,
  current_version integer not null default 1,

  client_id uuid references public.clients (id) on delete set null,
  project_id uuid references public.crm_projects (id) on delete set null,
  crm_lead_id uuid references public.crm_leads (id) on delete set null,
  conversation_id uuid references public.crm_conversations (id) on delete set null,
  automation_id uuid references public.automation_workflows (id) on delete set null,
  integration_id uuid references public.integrations (id) on delete set null,
  financial_transaction_id uuid references public.crm_financial_transactions (id) on delete set null,

  published_at timestamptz,
  published_by uuid references public.profiles (id) on delete set null,

  search_vector tsvector generated always as (
    setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(content_text, '')), 'C')
  ) stored,

  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz
);

alter table public.crm_knowledge_documents enable row level security;

create unique index if not exists crm_knowledge_documents_slug_idx
  on public.crm_knowledge_documents (slug) where deleted_at is null;
create index if not exists crm_knowledge_documents_category_idx on public.crm_knowledge_documents (category_id);
create index if not exists crm_knowledge_documents_status_idx on public.crm_knowledge_documents (status);
create index if not exists crm_knowledge_documents_client_idx on public.crm_knowledge_documents (client_id);
create index if not exists crm_knowledge_documents_project_idx on public.crm_knowledge_documents (project_id);
create index if not exists crm_knowledge_documents_lead_idx on public.crm_knowledge_documents (crm_lead_id);
create index if not exists crm_knowledge_documents_updated_idx on public.crm_knowledge_documents (updated_at desc);
create index if not exists crm_knowledge_documents_search_idx
  on public.crm_knowledge_documents using gin (search_vector);

drop trigger if exists set_crm_knowledge_documents_updated_at on public.crm_knowledge_documents;
create trigger set_crm_knowledge_documents_updated_at
  before update on public.crm_knowledge_documents
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê crm_knowledge_documents" on public.crm_knowledge_documents;
create policy "Equipe interna lê crm_knowledge_documents"
  on public.crm_knowledge_documents for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_knowledge_documents" on public.crm_knowledge_documents;
create policy "Equipe interna cria crm_knowledge_documents"
  on public.crm_knowledge_documents for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_knowledge_documents" on public.crm_knowledge_documents;
create policy "Equipe interna atualiza crm_knowledge_documents"
  on public.crm_knowledge_documents for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_knowledge_documents" on public.crm_knowledge_documents;
create policy "Equipe interna apaga crm_knowledge_documents"
  on public.crm_knowledge_documents for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Versionamento: uma linha por alteração salva, nunca sobrescrita.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_knowledge_versions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  document_id uuid not null references public.crm_knowledge_documents (id) on delete cascade,
  version_number integer not null,
  title text not null,
  content_json jsonb not null default '[]'::jsonb,
  summary text,
  change_note text,

  created_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_knowledge_versions enable row level security;

create unique index if not exists crm_knowledge_versions_doc_version_idx
  on public.crm_knowledge_versions (document_id, version_number);
create index if not exists crm_knowledge_versions_doc_idx
  on public.crm_knowledge_versions (document_id, created_at desc);

drop policy if exists "Equipe interna lê crm_knowledge_versions" on public.crm_knowledge_versions;
create policy "Equipe interna lê crm_knowledge_versions"
  on public.crm_knowledge_versions for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_knowledge_versions" on public.crm_knowledge_versions;
create policy "Equipe interna cria crm_knowledge_versions"
  on public.crm_knowledge_versions for insert
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
create table if not exists public.crm_knowledge_document_tags (
  document_id uuid not null references public.crm_knowledge_documents (id) on delete cascade,
  tag_id uuid not null references public.crm_knowledge_tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (document_id, tag_id)
);

alter table public.crm_knowledge_document_tags enable row level security;

create index if not exists crm_knowledge_document_tags_tag_idx on public.crm_knowledge_document_tags (tag_id);

drop policy if exists "Equipe interna lê crm_knowledge_document_tags" on public.crm_knowledge_document_tags;
create policy "Equipe interna lê crm_knowledge_document_tags"
  on public.crm_knowledge_document_tags for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_knowledge_document_tags" on public.crm_knowledge_document_tags;
create policy "Equipe interna cria crm_knowledge_document_tags"
  on public.crm_knowledge_document_tags for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_knowledge_document_tags" on public.crm_knowledge_document_tags;
create policy "Equipe interna apaga crm_knowledge_document_tags"
  on public.crm_knowledge_document_tags for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Arquivos: metadados aqui, binário no bucket Storage privado
-- crm-knowledge-files (criado no fim deste arquivo).
-- ----------------------------------------------------------------------------
create table if not exists public.crm_knowledge_files (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  document_id uuid references public.crm_knowledge_documents (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_size integer,
  mime_type text,
  kind text not null default 'outro'
    check (kind in ('imagem', 'pdf', 'docx', 'planilha', 'apresentacao', 'zip', 'video', 'outro')),

  uploaded_by uuid references public.profiles (id) on delete set null
);

alter table public.crm_knowledge_files enable row level security;

create index if not exists crm_knowledge_files_document_idx on public.crm_knowledge_files (document_id);

drop policy if exists "Equipe interna lê crm_knowledge_files" on public.crm_knowledge_files;
create policy "Equipe interna lê crm_knowledge_files"
  on public.crm_knowledge_files for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_knowledge_files" on public.crm_knowledge_files;
create policy "Equipe interna cria crm_knowledge_files"
  on public.crm_knowledge_files for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_knowledge_files" on public.crm_knowledge_files;
create policy "Equipe interna apaga crm_knowledge_files"
  on public.crm_knowledge_files for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Favoritos/fixados — por usuário.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_knowledge_favorites (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  document_id uuid not null references public.crm_knowledge_documents (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  pinned boolean not null default false
);

alter table public.crm_knowledge_favorites enable row level security;

create unique index if not exists crm_knowledge_favorites_doc_user_idx
  on public.crm_knowledge_favorites (document_id, user_id);
create index if not exists crm_knowledge_favorites_user_idx on public.crm_knowledge_favorites (user_id);

drop policy if exists "Equipe interna lê crm_knowledge_favorites" on public.crm_knowledge_favorites;
create policy "Equipe interna lê crm_knowledge_favorites"
  on public.crm_knowledge_favorites for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_knowledge_favorites" on public.crm_knowledge_favorites;
create policy "Equipe interna cria crm_knowledge_favorites"
  on public.crm_knowledge_favorites for insert
  with check (public.is_internal_staff() and user_id = auth.uid());
drop policy if exists "Equipe interna atualiza crm_knowledge_favorites" on public.crm_knowledge_favorites;
create policy "Equipe interna atualiza crm_knowledge_favorites"
  on public.crm_knowledge_favorites for update
  using (public.is_internal_staff() and user_id = auth.uid())
  with check (public.is_internal_staff() and user_id = auth.uid());
drop policy if exists "Equipe interna apaga crm_knowledge_favorites" on public.crm_knowledge_favorites;
create policy "Equipe interna apaga crm_knowledge_favorites"
  on public.crm_knowledge_favorites for delete
  using (public.is_internal_staff() and user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Visualizações e downloads — fonte de "mais acessados", "nunca acessados" e
-- do Histórico ("quem visualizou" / "quem baixou arquivo"). view_count de um
-- documento é sempre count(*) desta tabela com action='view', nunca uma
-- coluna redundante em crm_knowledge_documents.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_knowledge_views (
  id uuid primary key default gen_random_uuid(),
  viewed_at timestamptz not null default now(),

  document_id uuid not null references public.crm_knowledge_documents (id) on delete cascade,
  file_id uuid references public.crm_knowledge_files (id) on delete set null,
  action text not null default 'view' check (action in ('view', 'download')),
  user_id uuid references public.profiles (id) on delete set null
);

alter table public.crm_knowledge_views enable row level security;

create index if not exists crm_knowledge_views_document_idx
  on public.crm_knowledge_views (document_id, viewed_at desc);
create index if not exists crm_knowledge_views_action_idx on public.crm_knowledge_views (action);

drop policy if exists "Equipe interna lê crm_knowledge_views" on public.crm_knowledge_views;
create policy "Equipe interna lê crm_knowledge_views"
  on public.crm_knowledge_views for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_knowledge_views" on public.crm_knowledge_views;
create policy "Equipe interna cria crm_knowledge_views"
  on public.crm_knowledge_views for insert
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Permissões finas — override por documento OU categoria, por perfil
-- específico OU por role inteira. Lida pela camada de aplicação
-- (services/knowledge/knowledgePermissionService.ts); RLS de acesso
-- continua gateada por is_internal_staff() como em todo o resto do sistema.
-- ----------------------------------------------------------------------------
create table if not exists public.crm_knowledge_permissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  document_id uuid references public.crm_knowledge_documents (id) on delete cascade,
  category_id uuid references public.crm_knowledge_categories (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete cascade,
  role text check (role in ('administrador', 'gestor', 'comercial', 'atendimento', 'cliente')),

  can_view boolean not null default true,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  can_publish boolean not null default false,
  can_approve boolean not null default false,
  can_duplicate boolean not null default true,
  can_favorite boolean not null default true,

  granted_by uuid references public.profiles (id) on delete set null,

  constraint crm_knowledge_permissions_target_check
    check (document_id is not null or category_id is not null),
  constraint crm_knowledge_permissions_grantee_check
    check (profile_id is not null or role is not null)
);

alter table public.crm_knowledge_permissions enable row level security;

create index if not exists crm_knowledge_permissions_document_idx on public.crm_knowledge_permissions (document_id);
create index if not exists crm_knowledge_permissions_category_idx on public.crm_knowledge_permissions (category_id);
create index if not exists crm_knowledge_permissions_profile_idx on public.crm_knowledge_permissions (profile_id);

drop policy if exists "Equipe interna lê crm_knowledge_permissions" on public.crm_knowledge_permissions;
create policy "Equipe interna lê crm_knowledge_permissions"
  on public.crm_knowledge_permissions for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria crm_knowledge_permissions" on public.crm_knowledge_permissions;
create policy "Equipe interna cria crm_knowledge_permissions"
  on public.crm_knowledge_permissions for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza crm_knowledge_permissions" on public.crm_knowledge_permissions;
create policy "Equipe interna atualiza crm_knowledge_permissions"
  on public.crm_knowledge_permissions for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga crm_knowledge_permissions" on public.crm_knowledge_permissions;
create policy "Equipe interna apaga crm_knowledge_permissions"
  on public.crm_knowledge_permissions for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Bucket Storage privado para os arquivos da Base de Conhecimento — mesmo
-- padrão de crm-project-files (Fase 12) e crm-financial-documents (Fase 14):
-- sem policy de update, acesso só por is_internal_staff(), sempre via Signed
-- URL de curta duração.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('crm-knowledge-files', 'crm-knowledge-files', false)
on conflict (id) do nothing;

drop policy if exists "Equipe interna lê arquivos crm-knowledge-files" on storage.objects;
create policy "Equipe interna lê arquivos crm-knowledge-files"
  on storage.objects for select
  using (bucket_id = 'crm-knowledge-files' and public.is_internal_staff());
drop policy if exists "Equipe interna envia arquivos crm-knowledge-files" on storage.objects;
create policy "Equipe interna envia arquivos crm-knowledge-files"
  on storage.objects for insert
  with check (bucket_id = 'crm-knowledge-files' and public.is_internal_staff());
drop policy if exists "Equipe interna apaga arquivos crm-knowledge-files" on storage.objects;
create policy "Equipe interna apaga arquivos crm-knowledge-files"
  on storage.objects for delete
  using (bucket_id = 'crm-knowledge-files' and public.is_internal_staff());
