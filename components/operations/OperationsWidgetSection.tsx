"use client";

import { useOperationsLayout } from "@/contexts/operations/OperationsLayoutContext";
import type { OperationsWidgetKey } from "@/types/operations";

/** Every widget on the page is wrapped in this — it reads the user's
 * personal layout from context and simply doesn't render its children when
 * hidden. Keeps the show/hide rule in exactly one place instead of each
 * widget re-checking visibility itself. */
export function OperationsWidgetSection({
  widgetKey,
  children,
}: {
  widgetKey: OperationsWidgetKey;
  children: React.ReactNode;
}) {
  const { isVisible } = useOperationsLayout();
  if (!isVisible(widgetKey)) return null;
  return <div className="crm-ops-widget-section">{children}</div>;
}
