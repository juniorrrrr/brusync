"use client";

import { useProcessChecklistItem } from "@/hooks/processes/useProcessChecklistItem";
import type { ProcessChecklistItem } from "@/types/processes";

export function ChecklistItemRow({
  item,
  processId,
}: {
  item: ProcessChecklistItem;
  processId: string;
}) {
  const { status, toggle, isPending } = useProcessChecklistItem(item.id, processId, item.status);
  const done = status === "concluido";

  return (
    <label className="crm-proc-checklist-item">
      <input type="checkbox" checked={done} disabled={isPending} onChange={toggle} />
      <span className={done ? "crm-proc-checklist-done" : ""}>{item.label}</span>
      {done && item.completedByName && (
        <span className="crm-card-sub">— {item.completedByName}</span>
      )}
    </label>
  );
}
