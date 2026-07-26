"use client";

import { IconPencil, IconPlus } from "@/components/ui/icons";
import { useAnalyticsDashboard } from "@/contexts/analytics/AnalyticsDashboardContext";
import { useAnalyticsWidgetEditor } from "@/contexts/analytics/AnalyticsWidgetEditorContext";

export function AnalyticsEditModeBar() {
  const { editMode, setEditMode } = useAnalyticsDashboard();
  const { openCreate } = useAnalyticsWidgetEditor();

  return (
    <div className="crm-modal-actions" style={{ justifyContent: "flex-start" }}>
      <button
        type="button"
        className={`btn ${editMode ? "btn-accent" : "btn-outline"}`}
        onClick={() => setEditMode(!editMode)}
      >
        <IconPencil size={13} /> {editMode ? "Sair do modo edição" : "Modo edição"}
      </button>
      {editMode && (
        <button type="button" className="btn btn-outline" onClick={openCreate}>
          <IconPlus size={13} /> Adicionar widget
        </button>
      )}
    </div>
  );
}
