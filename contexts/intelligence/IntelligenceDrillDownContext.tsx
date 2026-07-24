"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { IntelligenceAlert, IntelligenceInsight } from "@/types/intelligence";

export type DrillDownItem =
  | { kind: "insight"; item: IntelligenceInsight }
  | { kind: "alerta"; item: IntelligenceAlert };

interface DrillDownContextValue {
  current: DrillDownItem | null;
  open: (item: DrillDownItem) => void;
  close: () => void;
}

const IntelligenceDrillDownContext = createContext<DrillDownContextValue | null>(null);

/** Global drill-down panel state — every insight/alert/recommendation/feed
 * card across the Central de Inteligência opens the SAME panel instead of
 * each rendering its own modal, so "abrir os dados que originaram aquela
 * informação" behaves identically everywhere (Fase 19 spec: "nada pode ser
 * uma caixa preta"). The panel reads evidence straight off the item already
 * in hand — no extra fetch, works the same in Modo Demonstração. */
export function IntelligenceDrillDownProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<DrillDownItem | null>(null);

  const open = useCallback((item: DrillDownItem) => setCurrent(item), []);
  const close = useCallback(() => setCurrent(null), []);

  const value = useMemo(() => ({ current, open, close }), [current, open, close]);

  return (
    <IntelligenceDrillDownContext.Provider value={value}>
      {children}
    </IntelligenceDrillDownContext.Provider>
  );
}

export function useIntelligenceDrillDown() {
  const ctx = useContext(IntelligenceDrillDownContext);
  if (!ctx)
    throw new Error(
      "useIntelligenceDrillDown deve ser usado dentro de IntelligenceDrillDownProvider",
    );
  return ctx;
}
