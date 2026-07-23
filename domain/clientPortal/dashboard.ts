import { buildPortalProjectTimeline } from "@/domain/clientPortal/timeline";
import type {
  PortalDashboardData,
  PortalProjectDetail,
  PortalUpcomingDelivery,
} from "@/types/clientPortal";

const RECENT_ACTIVITY_LIMIT = 8;
const UPCOMING_DELIVERIES_LIMIT = 6;

/** Powers the portal's "Tela Inicial" — active/completed counts, overall
 * progress across every project, últimas movimentações (the Fase 12
 * computed-Timeline concept, aggregated, PLUS this phase's own client/team
 * messages — buildPortalProjectTimeline per project, not the plain Fase 12
 * buildClientProjectsTimeline, otherwise a new message would never show up
 * here) and próximas entregas (the project itself, or any of its
 * phases/tasks, with a due date still ahead). */
export function buildPortalDashboardData(projects: PortalProjectDetail[]): PortalDashboardData {
  const activeProjects = projects.filter(
    (p) => p.status === "planejamento" || p.status === "em_andamento" || p.status === "pausado",
  ).length;
  const completedProjects = projects.filter((p) => p.status === "concluido").length;

  const totalTasks = projects.reduce((sum, p) => sum + p.taskCount, 0);
  const doneTasks = projects.reduce((sum, p) => sum + p.taskDoneCount, 0);
  const overallProgressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const recentActivity = projects
    .flatMap((project) => buildPortalProjectTimeline(project))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, RECENT_ACTIVITY_LIMIT);

  const now = new Date().toISOString();
  const upcomingDeliveries: PortalUpcomingDelivery[] = [];

  for (const project of projects) {
    if (project.dueAt && project.dueAt >= now && project.status !== "concluido") {
      upcomingDeliveries.push({
        id: `${project.id}-project`,
        projectId: project.id,
        projectName: project.name,
        title: `Entrega do projeto "${project.name}"`,
        dueAt: project.dueAt,
        kind: "projeto",
      });
    }
    for (const phase of project.phases) {
      if (phase.dueAt && phase.dueAt >= now && phase.status !== "concluido") {
        upcomingDeliveries.push({
          id: `${phase.id}-phase`,
          projectId: project.id,
          projectName: project.name,
          title: `Etapa "${phase.name}"`,
          dueAt: phase.dueAt,
          kind: "etapa",
        });
      }
      for (const task of phase.tasks) {
        if (task.dueAt && task.dueAt >= now && task.status !== "concluido") {
          upcomingDeliveries.push({
            id: `${task.id}-task`,
            projectId: project.id,
            projectName: project.name,
            title: task.title,
            dueAt: task.dueAt,
            kind: "tarefa",
          });
        }
      }
    }
  }

  upcomingDeliveries.sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  return {
    activeProjects,
    completedProjects,
    overallProgressPercent,
    recentActivity,
    upcomingDeliveries: upcomingDeliveries.slice(0, UPCOMING_DELIVERIES_LIMIT),
  };
}
