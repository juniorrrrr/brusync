"use client";

import { useEffect, useRef, useState } from "react";
import { fetchClientProjectsTimeline } from "@/application/projects/projectsActions";
import { ProjectRow } from "@/components/projects/ProjectRow";
import { useProjectDrawer } from "@/contexts/projects/ProjectDrawerContext";
import { useProjectEditor } from "@/contexts/projects/ProjectEditorContext";
import { formatDateTime } from "@/domain/crm/format";
import { useClientProjects } from "@/hooks/projects/useClientProjects";
import type { ProjectTimelineEntry } from "@/types/projects";

/** Additive section appended to the existing Cliente drawer (no existing
 * content there is touched) — "Cada Cliente poderá possuir vários
 * Projetos", so this is where they're listed, created, and where the
 * aggregate cross-project Timeline is shown. */
export function ClientProjectsSection({
  clientId,
  clientCompany,
}: {
  clientId: string;
  clientCompany: string;
}) {
  const { projects, loading, reload } = useClientProjects(clientId);
  const { openCreate } = useProjectEditor();
  const { projectId } = useProjectDrawer();
  const wasDrawerOpenRef = useRef(false);
  const [timeline, setTimeline] = useState<ProjectTimelineEntry[]>([]);

  function reloadAll() {
    reload();
    fetchClientProjectsTimeline(clientId).then(setTimeline);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadAll is intentionally not memoized — this effect only needs to run on mount/clientId change.
  useEffect(() => {
    reloadAll();
  }, [clientId]);

  // Refetch when the Project Drawer (opened from "Novo projeto"/"Abrir")
  // transitions from open back to closed — the natural moment a create or
  // edit inside it would have changed this client's project list.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadAll is intentionally not memoized — only projectId should trigger this effect.
  useEffect(() => {
    if (projectId) {
      wasDrawerOpenRef.current = true;
    } else if (wasDrawerOpenRef.current) {
      wasDrawerOpenRef.current = false;
      reloadAll();
    }
  }, [projectId]);

  return (
    <div
      className="crm-drawer-section"
      style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)" }}
    >
      <div className="crm-card-head">
        <div className="crm-drawer-section-title" style={{ marginBottom: 0 }}>
          Projetos
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => openCreate(clientId, clientCompany)}
        >
          Novo projeto
        </button>
      </div>

      {loading && <p className="crm-card-sub">Carregando…</p>}
      {!loading && projects.length === 0 && (
        <p className="crm-card-sub" style={{ marginTop: 8 }}>
          Nenhum projeto criado para este cliente ainda.
        </p>
      )}
      {!loading &&
        projects.map((project) => (
          <ProjectRow key={project.id} project={project} onChanged={reloadAll} />
        ))}

      {timeline.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="crm-drawer-section-title" style={{ fontSize: 13 }}>
            Timeline
          </div>
          {timeline.slice(0, 10).map((entry) => (
            <div key={entry.id} className="crm-pj-task-row">
              <div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 12.5 }}>{entry.title}</strong>
                </div>
                <div className="crm-card-sub" style={{ marginTop: 2 }}>
                  {entry.projectName} · {formatDateTime(entry.occurredAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
