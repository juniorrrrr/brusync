import { type AiSuggestionDraft, daysSince } from "@/domain/ai/suggestionDraft";
import type { Project, ProjectTask } from "@/types/projects";
import type { TeamMemberBreakdownRow } from "@/types/team";

export interface ProjetosInsightsInput {
  projects: Project[];
  now: Date;
  criticalTasksByProject: Map<string, ProjectTask[]>;
  projectsByMember: TeamMemberBreakdownRow[];
}

function isActive(project: Project): boolean {
  return project.status !== "concluido" && project.status !== "cancelado";
}

/** Assistente de Projetos (Fase 26) — reaproveita
 * application/projects/projectsQueries.ts (getProjectsPageData) e
 * application/team/teamQueries.ts::fetchTeamDashboardData (breakdown
 * "Projetos por responsável", Fase 25) para "carga da equipe" — nenhuma
 * lógica de agregação nova. */
export function buildProjetosInsights(input: ProjetosInsightsInput): AiSuggestionDraft[] {
  const { projects, now, criticalTasksByProject, projectsByMember } = input;
  const drafts: AiSuggestionDraft[] = [];

  const overdue = projects
    .filter((p) => isActive(p) && p.dueAt !== null && new Date(p.dueAt).getTime() < now.getTime())
    .sort((a, b) => new Date(a.dueAt as string).getTime() - new Date(b.dueAt as string).getTime());
  drafts.push({
    type: "projeto_atrasado",
    module: "projetos",
    contextRef: null,
    title: "Projetos atrasados",
    content:
      overdue.length > 0
        ? overdue
            .slice(0, 5)
            .map(
              (p) =>
                `• ${p.name} — prazo era ${new Date(p.dueAt as string).toLocaleDateString("pt-BR")} (${daysSince(p.dueAt, now)} dia(s) atrás)`,
            )
            .join("\n")
        : "Nenhum projeto ativo está com o prazo vencido.",
    severity: overdue.length >= 3 ? "critico" : overdue.length > 0 ? "atencao" : "info",
    evidence: [{ label: "Projetos ativos", value: String(projects.filter(isActive).length) }],
  });

  const withoutOwner = projects.filter((p) => isActive(p) && p.ownerId === null);
  drafts.push({
    type: "projeto_sem_responsavel",
    module: "projetos",
    contextRef: null,
    title: "Projetos sem responsável",
    content:
      withoutOwner.length > 0
        ? withoutOwner.map((p) => `• ${p.name}`).join("\n")
        : "Todos os projetos ativos têm um responsável definido.",
    severity: withoutOwner.length > 0 ? "atencao" : "info",
    evidence: [],
  });

  const criticalTasks: { project: Project; task: ProjectTask }[] = [];
  for (const project of projects) {
    const tasks = criticalTasksByProject.get(project.id) ?? [];
    for (const task of tasks) {
      if (task.priority === "alta" && task.status !== "concluido") {
        criticalTasks.push({ project, task });
      }
    }
  }
  drafts.push({
    type: "tarefa_critica",
    module: "projetos",
    contextRef: null,
    title: "Tarefas críticas",
    content:
      criticalTasks.length > 0
        ? criticalTasks
            .slice(0, 5)
            .map((row) => `• ${row.task.title} — projeto "${row.project.name}"`)
            .join("\n")
        : "Nenhuma tarefa de prioridade alta pendente nos projetos em atraso.",
    severity: criticalTasks.length >= 3 ? "critico" : criticalTasks.length > 0 ? "atencao" : "info",
    evidence: [],
  });

  const topLoad = [...projectsByMember].sort((a, b) => b.value - a.value).slice(0, 5);
  drafts.push({
    type: "carga_equipe",
    module: "projetos",
    contextRef: null,
    title: "Carga da equipe",
    content:
      topLoad.length > 0
        ? topLoad.map((row) => `• ${row.name} — ${row.value} projeto(s)`).join("\n")
        : "Nenhum projeto atribuído a colaboradores ainda.",
    severity: "info",
    evidence: [],
  });

  return drafts;
}
