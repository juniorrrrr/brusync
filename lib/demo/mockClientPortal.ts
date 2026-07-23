import { buildPortalDashboardData } from "@/domain/clientPortal/dashboard";
import { getDemoClientsPageData } from "@/lib/demo/mockCrm";
import { getDemoProjectDetail, getDemoProjectDetailsForClient } from "@/lib/demo/mockProjects";
import type {
  PortalAccess,
  PortalDashboardData,
  PortalMessage,
  PortalProjectDetail,
} from "@/types/clientPortal";
import type { ProjectDetail } from "@/types/projects";

/** The demo portal always "logs in" as the first demo client — the exact
 * same client (and projects) lib/demo/mockProjects.ts already builds for
 * index 0, so the internal CRM's demo Cliente drawer and the demo portal
 * show the identical company/projects, never two disconnected fictions. */
function getDemoPortalClient() {
  const { clients } = getDemoClientsPageData({});
  return clients[0];
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function buildDemoMessages(project: ProjectDetail): PortalMessage[] {
  return [
    {
      id: `${project.id}-portal-msg-1`,
      projectId: project.id,
      authorType: "cliente",
      authorProfileId: null,
      authorName: getDemoPortalClient().name || getDemoPortalClient().company,
      body: "Como está o andamento da etapa atual? Precisamos alinhar o prazo com nossa diretoria.",
      createdAt: daysFromNow(-3),
    },
    {
      id: `${project.id}-portal-msg-2`,
      projectId: project.id,
      authorType: "equipe",
      authorProfileId: null,
      authorName: project.ownerName ?? "Equipe Brusync",
      body: "Está dentro do prazo previsto — devemos concluir a etapa atual até o fim da semana.",
      createdAt: daysFromNow(-2),
    },
  ];
}

export function getDemoPortalAccess(): PortalAccess {
  const client = getDemoPortalClient();
  return { clientId: client.id, clientCompany: client.company, canUploadFiles: true };
}

export function getDemoPortalDashboardData(): PortalDashboardData {
  const client = getDemoPortalClient();
  const projects = getDemoProjectDetailsForClient(client.id);
  const portalProjects: PortalProjectDetail[] = projects.map((project) => ({
    ...project,
    messages: buildDemoMessages(project),
  }));
  return buildPortalDashboardData(portalProjects);
}

export function getDemoPortalProjects() {
  const client = getDemoPortalClient();
  return getDemoProjectDetailsForClient(client.id).map(({ phases, files, ...project }) => project);
}

export function getDemoPortalProjectDetail(projectId: string): PortalProjectDetail | null {
  const client = getDemoPortalClient();
  const project = getDemoProjectDetail(projectId);
  if (!project || project.clientId !== client.id) return null;

  return { ...project, messages: buildDemoMessages(project) };
}
