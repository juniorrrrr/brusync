"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { fetchProjectDetail } from "@/application/projects/projectsActions";
import type { ProjectDetail } from "@/types/projects";

interface ProjectEditorState {
  mode: "closed" | "create" | "edit";
  project: ProjectDetail | null;
  fixedClientId: string | null;
  fixedClientCompany: string | null;
  loading: boolean;
  error: string | null;
}

interface ProjectEditorContextValue extends ProjectEditorState {
  openCreate: (fixedClientId?: string, fixedClientCompany?: string) => void;
  openEdit: (projectId: string) => void;
  close: () => void;
}

const ProjectEditorContext = createContext<ProjectEditorContextValue | null>(null);

/** Shared create/edit form state — used both from the main /projetos list
 * (no fixed client, ClientPicker shown) and from the Cliente drawer's
 * "Novo projeto" button (client pre-set, picker hidden), same reasoning as
 * AgendaEventDialogContext's fixedLeadId. */
export function ProjectEditorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProjectEditorState>({
    mode: "closed",
    project: null,
    fixedClientId: null,
    fixedClientCompany: null,
    loading: false,
    error: null,
  });

  const openCreate = useCallback((fixedClientId?: string, fixedClientCompany?: string) => {
    setState({
      mode: "create",
      project: null,
      fixedClientId: fixedClientId ?? null,
      fixedClientCompany: fixedClientCompany ?? null,
      loading: false,
      error: null,
    });
  }, []);

  const openEdit = useCallback((projectId: string) => {
    setState((current) => ({
      mode: "edit",
      project: null,
      fixedClientId: current.fixedClientId,
      fixedClientCompany: current.fixedClientCompany,
      loading: true,
      error: null,
    }));
    fetchProjectDetail(projectId)
      .then((project) => {
        setState((current) => ({
          mode: "edit",
          project,
          fixedClientId: current.fixedClientId,
          fixedClientCompany: current.fixedClientCompany,
          loading: false,
          error: project ? null : "Projeto não encontrado.",
        }));
      })
      .catch((err) => {
        setState((current) => ({
          mode: "edit",
          project: null,
          fixedClientId: current.fixedClientId,
          fixedClientCompany: current.fixedClientCompany,
          loading: false,
          error: err instanceof Error ? err.message : "Falha ao carregar projeto.",
        }));
      });
  }, []);

  const close = useCallback(() => {
    setState({
      mode: "closed",
      project: null,
      fixedClientId: null,
      fixedClientCompany: null,
      loading: false,
      error: null,
    });
  }, []);

  const value = useMemo(
    () => ({ ...state, openCreate, openEdit, close }),
    [state, openCreate, openEdit, close],
  );

  return <ProjectEditorContext.Provider value={value}>{children}</ProjectEditorContext.Provider>;
}

export function useProjectEditor() {
  const ctx = useContext(ProjectEditorContext);
  if (!ctx) throw new Error("useProjectEditor deve ser usado dentro de ProjectEditorProvider");
  return ctx;
}
