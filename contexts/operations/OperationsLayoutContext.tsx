"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { saveOperationsLayoutAction } from "@/application/operations/operationsLayoutActions";
import type { OperationsWidgetConfig, OperationsWidgetKey } from "@/types/operations";

interface OperationsLayoutContextValue {
  layout: OperationsWidgetConfig[];
  isPending: boolean;
  isVisible: (key: OperationsWidgetKey) => boolean;
  toggleVisible: (key: OperationsWidgetKey) => void;
  moveUp: (key: OperationsWidgetKey) => void;
  moveDown: (key: OperationsWidgetKey) => void;
}

const OperationsLayoutContext = createContext<OperationsLayoutContextValue | null>(null);

function reorder(layout: OperationsWidgetConfig[]): OperationsWidgetConfig[] {
  return layout.map((widget, index) => ({ ...widget, order: index }));
}

function persist(layout: OperationsWidgetConfig[]) {
  saveOperationsLayoutAction(layout);
}

/** Client-side source of truth for widget visibility/order, seeded from the
 * layout the server already merged with the widget catalog
 * (mergeLayoutWithCatalog) — every change is applied optimistically and
 * persisted in the background, so toggling a widget never feels like a
 * round trip. */
export function OperationsLayoutProvider({
  initialLayout,
  children,
}: {
  initialLayout: OperationsWidgetConfig[];
  children: React.ReactNode;
}) {
  const [layout, setLayout] = useState(initialLayout);
  const [isPending, startTransition] = useTransition();

  const update = useCallback((next: OperationsWidgetConfig[]) => {
    const reordered = reorder(next);
    setLayout(reordered);
    startTransition(() => persist(reordered));
  }, []);

  const isVisible = useCallback(
    (key: OperationsWidgetKey) => layout.find((w) => w.key === key)?.visible ?? true,
    [layout],
  );

  const toggleVisible = useCallback(
    (key: OperationsWidgetKey) => {
      update(layout.map((w) => (w.key === key ? { ...w, visible: !w.visible } : w)));
    },
    [layout, update],
  );

  const moveUp = useCallback(
    (key: OperationsWidgetKey) => {
      const index = layout.findIndex((w) => w.key === key);
      if (index <= 0) return;
      const next = [...layout];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      update(next);
    },
    [layout, update],
  );

  const moveDown = useCallback(
    (key: OperationsWidgetKey) => {
      const index = layout.findIndex((w) => w.key === key);
      if (index === -1 || index >= layout.length - 1) return;
      const next = [...layout];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      update(next);
    },
    [layout, update],
  );

  const value = useMemo(
    () => ({ layout, isPending, isVisible, toggleVisible, moveUp, moveDown }),
    [layout, isPending, isVisible, toggleVisible, moveUp, moveDown],
  );

  return (
    <OperationsLayoutContext.Provider value={value}>{children}</OperationsLayoutContext.Provider>
  );
}

export function useOperationsLayout() {
  const ctx = useContext(OperationsLayoutContext);
  if (!ctx)
    throw new Error("useOperationsLayout deve ser usado dentro de OperationsLayoutProvider");
  return ctx;
}
