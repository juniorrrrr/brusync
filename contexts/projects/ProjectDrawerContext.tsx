"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { fetchProjectDetail } from "@/application/projects/projectsActions";
import type { ProjectDetail } from "@/types/projects";

interface ProjectDrawerState {
  projectId: string | null;
  data: ProjectDetail | null;
  loading: boolean;
  error: string | null;
}

interface ProjectDrawerContextValue extends ProjectDrawerState {
  openProject: (projectId: string) => void;
  close: () => void;
  refresh: () => void;
}

const ProjectDrawerContext = createContext<ProjectDrawerContextValue | null>(null);

/** Mounted once at the CRM app shell (same level as LeadDrawerProvider /
 * ClientDrawerProvider) so both the /projetos list and the Cliente
 * drawer's "Projetos" section can open the same drawer instance. */
export function ProjectDrawerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProjectDrawerState>({
    projectId: null,
    data: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async (projectId: string) => {
    setState({ projectId, data: null, loading: true, error: null });
    try {
      const data = await fetchProjectDetail(projectId);
      setState({ projectId, data, loading: false, error: data ? null : "Projeto não encontrado." });
    } catch (err) {
      setState({
        projectId,
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : "Falha ao carregar projeto.",
      });
    }
  }, []);

  const openProject = useCallback((projectId: string) => void load(projectId), [load]);

  const close = useCallback(() => {
    setState({ projectId: null, data: null, loading: false, error: null });
  }, []);

  const refresh = useCallback(() => {
    setState((current) => {
      if (current.projectId) void load(current.projectId);
      return current;
    });
  }, [load]);

  const value = useMemo(
    () => ({ ...state, openProject, close, refresh }),
    [state, openProject, close, refresh],
  );

  return <ProjectDrawerContext.Provider value={value}>{children}</ProjectDrawerContext.Provider>;
}

export function useProjectDrawer() {
  const ctx = useContext(ProjectDrawerContext);
  if (!ctx) throw new Error("useProjectDrawer deve ser usado dentro de ProjectDrawerProvider");
  return ctx;
}
