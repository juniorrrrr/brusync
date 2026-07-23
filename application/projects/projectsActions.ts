"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { buildClientProjectsTimeline } from "@/domain/projects/timeline";
import { PROJECT_STATUSES } from "@/domain/projects/types";
import { getDemoClientsPageData } from "@/lib/demo/mockCrm";
import {
  getDemoProjectDetail,
  getDemoProjectDetailsForClient,
  getDemoProjectsForClient,
} from "@/lib/demo/mockProjects";
import { listClients } from "@/repositories/crm/clientsRepository";
import {
  deleteProject,
  listProjectsForClient,
  updateProject,
} from "@/repositories/projects/projectsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import {
  createProjectWithDefaultPhases,
  getProjectDetail,
  getProjectDetailsForClient,
} from "@/services/projects/projectLifecycleService";
import { transitionProjectStatus } from "@/services/projects/projectStatusService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { ClientWithOwner } from "@/types/crm";
import type { Project, ProjectDetail, ProjectStatus, ProjectTimelineEntry } from "@/types/projects";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function fetchProjectDetail(id: string): Promise<ProjectDetail | null> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoProjectDetail(id);

  const supabase = await getSupabaseAuthClient();
  return getProjectDetail(supabase, id);
}

/** Client-callable wrapper for the Cliente drawer's "Projetos" section —
 * same pattern as fetchAgendaEventsForLead (Fase 11). */
export async function fetchProjectsForClient(clientId: string): Promise<Project[]> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoProjectsForClient(clientId);

  const supabase = await getSupabaseAuthClient();
  return listProjectsForClient(supabase, clientId);
}

/** Client-callable wrapper powering the Cliente drawer's aggregate
 * "Timeline" — every project that client has, computed and merged. */
export async function fetchClientProjectsTimeline(
  clientId: string,
): Promise<ProjectTimelineEntry[]> {
  await requireCrmProfile();
  if (await isDemoModeActive()) {
    return buildClientProjectsTimeline(getDemoProjectDetailsForClient(clientId));
  }

  const supabase = await getSupabaseAuthClient();
  const projects = await listProjectsForClient(supabase, clientId);
  const details = await getProjectDetailsForClient(
    supabase,
    projects.map((p) => p.id),
  );
  return buildClientProjectsTimeline(details);
}

export async function searchClientsAction(query: string): Promise<ClientWithOwner[]> {
  await requireCrmProfile();
  if (!query.trim()) return [];

  if (await isDemoModeActive()) {
    return getDemoClientsPageData({ search: query }).clients.slice(0, 8);
  }

  const supabase = await getSupabaseAuthClient();
  const clients = await listClients(supabase, { search: query });
  return clients.slice(0, 8);
}

export interface ProjectActionState {
  status: "idle" | "success" | "error";
  message?: string;
  projectId?: string;
}

export async function saveProjectAction(
  _prevState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const id = String(formData.get("id") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { status: "error", message: "Informe um nome para o projeto." };
  if (!id && !clientId) return { status: "error", message: "Selecione um cliente." };

  const description = String(formData.get("description") ?? "").trim();
  const ownerIdRaw = String(formData.get("ownerId") ?? "").trim();
  const dueAtRaw = String(formData.get("dueAt") ?? "").trim();
  const dueAt = dueAtRaw ? new Date(dueAtRaw).toISOString() : null;

  const supabase = await getSupabaseAuthClient();

  if (id) {
    await updateProject(supabase, id, {
      name,
      description: description || null,
      ownerId: ownerIdRaw || null,
      dueAt,
    });
    revalidatePath("/projetos");
    return { status: "success", message: "Projeto atualizado.", projectId: id };
  }

  const { id: newId } = await createProjectWithDefaultPhases(supabase, {
    clientId,
    name,
    description: description || null,
    ownerId: ownerIdRaw || null,
    dueAt,
    createdBy: profile.id,
  });

  revalidatePath("/projetos");
  return { status: "success", message: "Projeto criado.", projectId: newId };
}

export async function transitionProjectStatusAction(
  id: string,
  status: ProjectStatus,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };
  if (!PROJECT_STATUSES.includes(status)) return { ok: false, error: "Status inválido." };

  const supabase = await getSupabaseAuthClient();
  await transitionProjectStatus(supabase, id, status);

  revalidatePath("/projetos");
  return { ok: true };
}

export async function deleteProjectAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await deleteProject(supabase, id);

  revalidatePath("/projetos");
  return { ok: true };
}
