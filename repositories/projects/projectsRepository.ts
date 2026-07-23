import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Project, ProjectStatus, ProjectsHealth } from "@/types/projects";

interface ProjectRow {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  owner_id: string | null;
  started_at: string | null;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  client?: { company: string } | null;
  owner?: { name: string | null; email: string | null } | null;
  tasks?: { status: string }[] | null;
}

const PROJECT_SELECT = `
  id, client_id, name, description, status, owner_id, started_at, due_at, completed_at, created_at, updated_at,
  client:clients!crm_projects_client_id_fkey (company),
  owner:profiles!crm_projects_owner_id_fkey (name, email),
  tasks:crm_project_tasks!crm_project_tasks_project_id_fkey (status)
`;

function mapProject(row: ProjectRow): Project {
  const tasks = row.tasks ?? [];
  const taskDoneCount = tasks.filter((t) => t.status === "concluido").length;

  return {
    id: row.id,
    clientId: row.client_id,
    clientCompany: row.client?.company ?? null,
    name: row.name,
    description: row.description,
    status: row.status,
    ownerId: row.owner_id,
    ownerName: row.owner?.name ?? row.owner?.email ?? null,
    startedAt: row.started_at,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    progressPercent: tasks.length > 0 ? Math.round((taskDoneCount / tasks.length) * 100) : 0,
    taskCount: tasks.length,
    taskDoneCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListProjectsOptions {
  search?: string;
  ownerId?: string;
  status?: ProjectStatus;
  clientId?: string;
  createdFrom?: string;
  createdTo?: string;
  dueFrom?: string;
  dueTo?: string;
  limit?: number;
  offset?: number;
}

export interface ProjectsPage {
  projects: Project[];
  total: number;
}

export async function listProjects(
  supabase: SupabaseClient,
  options: ListProjectsOptions = {},
): Promise<ProjectsPage> {
  let query = supabase.from("crm_projects").select(PROJECT_SELECT, { count: "exact" });

  if (options.ownerId) query = query.eq("owner_id", options.ownerId);
  if (options.status) query = query.eq("status", options.status);
  if (options.clientId) query = query.eq("client_id", options.clientId);
  if (options.createdFrom) query = query.gte("created_at", options.createdFrom);
  if (options.createdTo) query = query.lte("created_at", options.createdTo);
  if (options.dueFrom) query = query.gte("due_at", options.dueFrom);
  if (options.dueTo) query = query.lte("due_at", options.dueTo);
  if (options.search) {
    const term = options.search.replace(/[,()%]/g, " ").trim();
    if (term) query = query.ilike("name", `%${term}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 50) - 1);

  if (error) throw new Error(`Falha ao carregar projetos: ${error.message}`);

  let projects = ((data ?? []) as unknown as ProjectRow[]).map(mapProject);

  // Client company search needs the joined resource, filtered in JS after
  // the query — same approach used across the app for embedded-resource
  // filters (conversion_events, automation_workflows, agenda events).
  if (options.search) {
    const term = options.search.toLowerCase();
    projects = projects.filter(
      (p) => p.name.toLowerCase().includes(term) || p.clientCompany?.toLowerCase().includes(term),
    );
  }

  return { projects, total: count ?? projects.length };
}

export async function listProjectsForClient(
  supabase: SupabaseClient,
  clientId: string,
): Promise<Project[]> {
  const { data, error } = await supabase
    .from("crm_projects")
    .select(PROJECT_SELECT)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar projetos do cliente: ${error.message}`);
  return ((data ?? []) as unknown as ProjectRow[]).map(mapProject);
}

export async function getProjectById(
  supabase: SupabaseClient,
  id: string,
): Promise<Project | null> {
  const { data, error } = await supabase
    .from("crm_projects")
    .select(PROJECT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar projeto: ${error.message}`);
  return data ? mapProject(data as unknown as ProjectRow) : null;
}

export interface CreateProjectPayload {
  clientId: string;
  name: string;
  description: string | null;
  ownerId: string | null;
  dueAt: string | null;
  createdBy: string | null;
}

export async function createProject(
  supabase: SupabaseClient,
  payload: CreateProjectPayload,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("crm_projects")
    .insert({
      client_id: payload.clientId,
      name: payload.name,
      description: payload.description,
      owner_id: payload.ownerId,
      due_at: payload.dueAt,
      started_at: new Date().toISOString(),
      created_by: payload.createdBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar projeto: ${error.message}`);
  return data as { id: string };
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  ownerId?: string | null;
  startedAt?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
}

export async function updateProject(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateProjectPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.ownerId !== undefined) payload.owner_id = patch.ownerId;
  if (patch.startedAt !== undefined) payload.started_at = patch.startedAt;
  if (patch.dueAt !== undefined) payload.due_at = patch.dueAt;
  if (patch.completedAt !== undefined) payload.completed_at = patch.completedAt;

  const { error } = await supabase.from("crm_projects").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar projeto: ${error.message}`);
}

export async function deleteProject(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("crm_projects").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir projeto: ${error.message}`);
}

export async function getProjectsHealthStats(supabase: SupabaseClient): Promise<ProjectsHealth> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("crm_projects")
    .select(
      "status, owner_id, started_at, due_at, completed_at, owner:profiles!crm_projects_owner_id_fkey (name, email)",
    );

  if (error) throw new Error(`Falha ao calcular indicadores de projetos: ${error.message}`);

  type StatsRow = {
    status: ProjectStatus;
    owner_id: string | null;
    started_at: string | null;
    due_at: string | null;
    completed_at: string | null;
    owner: { name: string | null; email: string | null } | null;
  };

  const rows = (data ?? []) as unknown as StatsRow[];

  const activeProjects = rows.filter(
    (r) => r.status === "planejamento" || r.status === "em_andamento",
  ).length;
  const completedProjects = rows.filter((r) => r.status === "concluido").length;
  const overdueProjects = rows.filter(
    (r) => r.due_at && r.due_at < now && r.status !== "concluido" && r.status !== "cancelado",
  ).length;

  const delivered = rows.filter((r) => r.status === "concluido" && r.started_at && r.completed_at);
  const averageDeliveryDays =
    delivered.length > 0
      ? Math.round(
          (delivered.reduce(
            (sum, r) =>
              sum +
              (new Date(r.completed_at as string).getTime() -
                new Date(r.started_at as string).getTime()),
            0,
          ) /
            delivered.length /
            (1000 * 60 * 60 * 24)) *
            10,
        ) / 10
      : null;

  const byOwnerMap = new Map<
    string,
    { ownerId: string | null; ownerName: string | null; count: number }
  >();
  for (const row of rows) {
    const key = row.owner_id ?? "sem_responsavel";
    const existing = byOwnerMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byOwnerMap.set(key, {
        ownerId: row.owner_id,
        ownerName: row.owner?.name ?? row.owner?.email ?? null,
        count: 1,
      });
    }
  }

  const byStatusMap = new Map<ProjectStatus, number>();
  for (const row of rows) {
    byStatusMap.set(row.status, (byStatusMap.get(row.status) ?? 0) + 1);
  }

  return {
    activeProjects,
    completedProjects,
    overdueProjects,
    averageDeliveryDays,
    byOwner: [...byOwnerMap.values()].sort((a, b) => b.count - a.count),
    byStatus: [...byStatusMap.entries()].map(([status, count]) => ({ status, count })),
  };
}
