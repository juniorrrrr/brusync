"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

export interface PlaybookWorkspaceContextValue {
  readonlyMode: boolean;
}

const PlaybookWorkspaceContext = createContext<PlaybookWorkspaceContextValue>({
  readonlyMode: true,
});

export function PlaybookWorkspaceProvider({ children }: { children: ReactNode }) {
  return (
    <PlaybookWorkspaceContext.Provider value={{ readonlyMode: true }}>
      {children}
    </PlaybookWorkspaceContext.Provider>
  );
}

export function usePlaybookWorkspace() {
  return useContext(PlaybookWorkspaceContext);
}
