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
