import { DEFAULT_PROJECT_PHASES } from "@/domain/projects/defaultPhases";
import { getDemoClientsPageData } from "@/lib/demo/mockCrm";
import { DEMO_OWNERS } from "@/lib/demo/mockSeed";
import type { ListProjectsOptions } from "@/repositories/projects/projectsRepository";
import type {
  Project,
  ProjectDetail,
  ProjectFile,
  ProjectPhase,
  ProjectStatus,
  ProjectsHealth,
  ProjectTask,
  ProjectTaskPriority,
} from "@/types/projects";

const PROJECT_NAMES = [
  "Implantação de CRM",
  "Portal do Cliente",
  "Aplicativo Mobile",
  "Automação de Processos",
  "Dashboard Executivo",
  "Integração de Sistemas",
  "E-commerce B2B",
  "Central Omnichannel",
];

const TASK_TITLES_BY_PHASE: Record<string, string[]> = {
  Diagnóstico: ["Levantamento de requisitos", "Mapeamento de processos atuais"],
  Planejamento: ["Definir escopo técnico", "Aprovar cronograma com o cliente"],
  Desenvolvimento: ["Configurar ambiente", "Implementar módulo principal"],
  Integração: ["Integrar com sistemas legados", "Testar fluxo de dados"],
  Validação: ["Homologação com o cliente", "Corrigir ajustes apontados"],
  Entrega: ["Treinamento da equipe", "Publicar em produção"],
  Concluído: ["Encerramento formal do projeto"],
};

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

interface ProjectPlan {
  status: ProjectStatus;
  startedDaysAgo: number;
  dueDaysFromNow: number;
  completedDaysAgo: number | null;
  currentPhaseIndex: number;
}

function planFor(index: number): ProjectPlan {
  switch (index % 5) {
    case 0:
      return {
        status: "em_andamento",
        startedDaysAgo: 20,
        dueDaysFromNow: 10,
        completedDaysAgo: null,
        currentPhaseIndex: 2,
      };
    case 1:
      return {
        status: "em_andamento",
        startedDaysAgo: 40,
        dueDaysFromNow: -5,
        completedDaysAgo: null,
        currentPhaseIndex: 4,
      };
    case 2:
      return {
        status: "concluido",
        startedDaysAgo: 60,
        dueDaysFromNow: -10,
        completedDaysAgo: 5,
        currentPhaseIndex: 6,
      };
    case 3:
      return {
        status: "planejamento",
        startedDaysAgo: 2,
        dueDaysFromNow: 45,
        completedDaysAgo: null,
        currentPhaseIndex: 0,
      };
    default:
      return {
        status: "pausado",
        startedDaysAgo: 15,
        dueDaysFromNow: 20,
        completedDaysAgo: null,
        currentPhaseIndex: 1,
      };
  }
}

function buildPhases(projectId: string, plan: ProjectPlan): ProjectPhase[] {
  const spacing = plan.startedDaysAgo / DEFAULT_PROJECT_PHASES.length;

  return DEFAULT_PROJECT_PHASES.map((name, position) => {
    const isDone = plan.status === "concluido" || position < plan.currentPhaseIndex;
    const isCurrent = plan.status !== "concluido" && position === plan.currentPhaseIndex;
    const status = isDone ? "concluido" : isCurrent ? "em_andamento" : "pendente";

    const startedAt =
      isDone || isCurrent ? daysFromNow(-(plan.startedDaysAgo - position * spacing)) : null;
    const completedAt = isDone
      ? daysFromNow(-(plan.startedDaysAgo - (position + 1) * spacing))
      : null;

    const tasks: ProjectTask[] =
      isDone || isCurrent
        ? (TASK_TITLES_BY_PHASE[name] ?? []).map((title, taskIndex) => {
            const taskDone = isDone || taskIndex === 0;
            const owner = DEMO_OWNERS[(position + taskIndex) % DEMO_OWNERS.length];
            return {
              id: `00000000-a014-4000-8000-${String(position * 10 + taskIndex + 1).padStart(6, "0")}${projectId.slice(-6)}`,
              projectId,
              phaseId: `${projectId}-phase-${position}`,
              title,
              description: null,
              assigneeId: owner.id,
              assigneeName: owner.name,
              priority: (["baixa", "media", "alta"] as ProjectTaskPriority[])[taskIndex % 3],
              dueAt: completedAt ?? daysFromNow(plan.dueDaysFromNow),
              status: taskDone ? "concluido" : "em_andamento",
              completedAt: taskDone ? (completedAt ?? daysFromNow(-1)) : null,
              comments:
                isCurrent && taskIndex === 0
                  ? [
                      {
                        id: `${projectId}-comment-${position}`,
                        authorId: owner.id,
                        authorName: owner.name,
                        body: "Andamento dentro do esperado, seguindo para a próxima etapa.",
                        createdAt: daysFromNow(-1),
                      },
                    ]
                  : [],
              fileCount: isCurrent && taskIndex === 0 ? 1 : 0,
              createdAt: startedAt ?? daysFromNow(-plan.startedDaysAgo),
              updatedAt: completedAt ?? startedAt ?? daysFromNow(-plan.startedDaysAgo),
            };
          })
        : [];

    const doneCount = tasks.filter((t) => t.status === "concluido").length;

    return {
      id: `${projectId}-phase-${position}`,
      projectId,
      name,
      position,
      status,
      startedAt,
      dueAt: isCurrent ? daysFromNow(plan.dueDaysFromNow) : null,
      completedAt,
      tasks,
      progressPercent:
        tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : isDone ? 100 : 0,
    };
  });
}

function buildProjectDetail(clientId: string, clientCompany: string, index: number): ProjectDetail {
  const id = `00000000-a015-4000-8000-${String(index + 1).padStart(6, "0")}${clientId.slice(-6)}`;
  const plan = planFor(index);
  const owner = DEMO_OWNERS[index % DEMO_OWNERS.length];
  const phases = buildPhases(id, plan);
  const tasks = phases.flatMap((phase) => phase.tasks);
  const doneCount = tasks.filter((t) => t.status === "concluido").length;

  const files: ProjectFile[] = [
    {
      id: `${id}-file-0`,
      projectId: id,
      taskId: null,
      storagePath: `${id}/proposta-comercial.pdf`,
      fileName: "Proposta comercial.pdf",
      fileSize: 245_000,
      mimeType: "application/pdf",
      uploadedBy: owner.id,
      uploadedByName: owner.name,
      createdAt: daysFromNow(-plan.startedDaysAgo),
    },
  ];

  return {
    id,
    clientId,
    clientCompany,
    name: PROJECT_NAMES[index % PROJECT_NAMES.length],
    description: `Implantação para ${clientCompany}.`,
    status: plan.status,
    ownerId: owner.id,
    ownerName: owner.name,
    startedAt: daysFromNow(-plan.startedDaysAgo),
    dueAt: daysFromNow(plan.dueDaysFromNow),
    completedAt: plan.completedDaysAgo !== null ? daysFromNow(-plan.completedDaysAgo) : null,
    progressPercent: tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0,
    taskCount: tasks.length,
    taskDoneCount: doneCount,
    createdAt: daysFromNow(-plan.startedDaysAgo),
    updatedAt: daysFromNow(-1),
    phases,
    files,
  };
}

function buildAllDemoProjects(): ProjectDetail[] {
  const { clients } = getDemoClientsPageData({});
  return clients
    .slice(0, 8)
    .map((client, index) => buildProjectDetail(client.id, client.company, index));
}

function toProject(detail: ProjectDetail): Project {
  const { phases, files, ...project } = detail;
  return project;
}

export function getDemoProjects(options: ListProjectsOptions = {}): {
  projects: Project[];
  total: number;
} {
  let projects = buildAllDemoProjects().map(toProject);

  if (options.clientId) projects = projects.filter((p) => p.clientId === options.clientId);
  if (options.ownerId) projects = projects.filter((p) => p.ownerId === options.ownerId);
  if (options.status) projects = projects.filter((p) => p.status === options.status);
  if (options.search) {
    const term = options.search.toLowerCase();
    projects = projects.filter(
      (p) => p.name.toLowerCase().includes(term) || p.clientCompany?.toLowerCase().includes(term),
    );
  }

  const total = projects.length;
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  return { projects: projects.slice(offset, offset + limit), total };
}

export function getDemoProjectDetail(id: string): ProjectDetail | null {
  return buildAllDemoProjects().find((p) => p.id === id) ?? null;
}

export function getDemoProjectsForClient(clientId: string): Project[] {
  return buildAllDemoProjects()
    .filter((p) => p.clientId === clientId)
    .map(toProject);
}

export function getDemoProjectDetailsForClient(clientId: string): ProjectDetail[] {
  return buildAllDemoProjects().filter((p) => p.clientId === clientId);
}

export function getDemoProjectsHealth(): ProjectsHealth {
  const projects = buildAllDemoProjects().map(toProject);
  const now = new Date().toISOString();

  const activeProjects = projects.filter(
    (p) => p.status === "planejamento" || p.status === "em_andamento",
  ).length;
  const completedProjects = projects.filter((p) => p.status === "concluido").length;
  const overdueProjects = projects.filter(
    (p) => p.dueAt && p.dueAt < now && p.status !== "concluido" && p.status !== "cancelado",
  ).length;

  const delivered = projects.filter(
    (p) => p.status === "concluido" && p.startedAt && p.completedAt,
  );
  const averageDeliveryDays =
    delivered.length > 0
      ? Math.round(
          (delivered.reduce(
            (sum, p) =>
              sum +
              (new Date(p.completedAt as string).getTime() -
                new Date(p.startedAt as string).getTime()),
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
  for (const project of projects) {
    const key = project.ownerId ?? "sem_responsavel";
    const existing = byOwnerMap.get(key);
    if (existing) existing.count += 1;
    else byOwnerMap.set(key, { ownerId: project.ownerId, ownerName: project.ownerName, count: 1 });
  }

  const byStatusMap = new Map<ProjectStatus, number>();
  for (const project of projects) {
    byStatusMap.set(project.status, (byStatusMap.get(project.status) ?? 0) + 1);
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
