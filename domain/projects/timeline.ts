import type { ProjectDetail, ProjectTimelineEntry } from "@/types/projects";

/** No append-only log table exists for this — the "Timeline" (both the
 * Project drawer's own tab and the Cliente's aggregate view) is computed
 * on the fly from the timestamps already on crm_projects/_phases/_tasks/
 * _files. The act of creating a project, starting/finishing a phase,
 * completing a task or uploading a file already IS the record; this just
 * renders those facts in chronological order. */
export function buildProjectTimeline(project: ProjectDetail): ProjectTimelineEntry[] {
  const entries: ProjectTimelineEntry[] = [];

  entries.push({
    id: `${project.id}-created`,
    kind: "projeto_criado",
    title: `Projeto "${project.name}" criado`,
    subtitle: project.clientCompany,
    projectId: project.id,
    projectName: project.name,
    occurredAt: project.createdAt,
  });

  for (const phase of project.phases) {
    if (phase.startedAt) {
      entries.push({
        id: `${phase.id}-started`,
        kind: "etapa_iniciada",
        title: `Etapa "${phase.name}" iniciada`,
        subtitle: null,
        projectId: project.id,
        projectName: project.name,
        occurredAt: phase.startedAt,
      });
    }
    if (phase.completedAt) {
      entries.push({
        id: `${phase.id}-completed`,
        kind: "etapa_concluida",
        title: `Etapa "${phase.name}" concluída`,
        subtitle: null,
        projectId: project.id,
        projectName: project.name,
        occurredAt: phase.completedAt,
      });
    }

    for (const task of phase.tasks) {
      if (task.status === "concluido" && task.completedAt) {
        entries.push({
          id: `${task.id}-completed`,
          kind: "tarefa_concluida",
          title: `Tarefa concluída: ${task.title}`,
          subtitle: phase.name,
          projectId: project.id,
          projectName: project.name,
          occurredAt: task.completedAt,
        });
      }
    }
  }

  for (const file of project.files) {
    entries.push({
      id: `${file.id}-uploaded`,
      kind: "arquivo_enviado",
      title: `Arquivo enviado: ${file.fileName}`,
      subtitle: null,
      projectId: project.id,
      projectName: project.name,
      occurredAt: file.createdAt,
    });
  }

  if (project.status === "concluido" && project.completedAt) {
    entries.push({
      id: `${project.id}-finished`,
      kind: "projeto_finalizado",
      title: `Projeto "${project.name}" finalizado`,
      subtitle: null,
      projectId: project.id,
      projectName: project.name,
      occurredAt: project.completedAt,
    });
  }

  return entries.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

/** "A Timeline do Cliente" — the same computed events, aggregated across
 * every project that client has. */
export function buildClientProjectsTimeline(projects: ProjectDetail[]): ProjectTimelineEntry[] {
  return projects
    .flatMap((project) => buildProjectTimeline(project))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
