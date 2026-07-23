"use client";

import { useRouter } from "next/navigation";
import { ProjectRow } from "@/components/projects/ProjectRow";
import { useProjectEditor } from "@/contexts/projects/ProjectEditorContext";
import type { Project } from "@/types/projects";

export function ProjectsBoard({ projects, emptyText }: { projects: Project[]; emptyText: string }) {
  const router = useRouter();
  const { openCreate } = useProjectEditor();

  function handleChanged() {
    router.refresh();
  }

  return (
    <div className="crm-card crm-card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="crm-card-title">Projetos</div>
        <button type="button" className="btn btn-accent" onClick={() => openCreate()}>
          Novo projeto
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        {projects.length === 0 ? (
          <p className="crm-card-sub">{emptyText}</p>
        ) : (
          projects.map((project) => (
            <ProjectRow key={project.id} project={project} onChanged={handleChanged} />
          ))
        )}
      </div>
    </div>
  );
}
