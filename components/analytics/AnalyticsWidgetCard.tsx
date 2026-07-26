"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteWidgetAction } from "@/application/analytics/analyticsActions";
import { HeatmapGrid } from "@/components/analytics/charts/HeatmapGrid";
import { ScalarValue } from "@/components/analytics/charts/ScalarValue";
import { SeriesChart } from "@/components/analytics/charts/SeriesChart";
import { TableView } from "@/components/analytics/charts/TableView";
import { IconPencil, IconTrash } from "@/components/ui/icons";
import { useAnalyticsWidgetEditor } from "@/contexts/analytics/AnalyticsWidgetEditorContext";
import { WIDGET_SHAPE } from "@/domain/analytics/statusMeta";
import type { AnalyticsWidgetData } from "@/types/analytics";

export function AnalyticsWidgetCard({
  data,
  editMode,
}: {
  data: AnalyticsWidgetData;
  editMode: boolean;
}) {
  const { widget, result } = data;
  const { openEdit } = useAnalyticsWidgetEditor();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const shape = WIDGET_SHAPE[widget.type];

  function handleDelete() {
    startTransition(async () => {
      await deleteWidgetAction(widget.id);
      router.refresh();
    });
  }

  return (
    <div className={`crm-card crm-card-pad crm-an-widget crm-an-widget-${widget.size}`}>
      <div className="crm-int-card-top">
        <div className="crm-int-card-title">{widget.title}</div>
        {editMode && (
          <div className="crm-int-card-actions">
            <button
              type="button"
              className="crm-icon-btn"
              onClick={() => openEdit(widget)}
              aria-label="Editar widget"
            >
              <IconPencil size={13} />
            </button>
            <button
              type="button"
              className="crm-icon-btn"
              disabled={isPending}
              onClick={handleDelete}
              aria-label="Excluir widget"
            >
              <IconTrash size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="crm-an-widget-body">
        {shape === "scalar" && (
          <ScalarValue type={widget.type} title={widget.title} result={result} />
        )}
        {shape === "series" && (
          <SeriesChart
            variant={
              widget.type as "linha" | "barras" | "area" | "pizza" | "radar" | "funil" | "ranking"
            }
            points={result.series}
            unit={result.unit}
          />
        )}
        {shape === "table" && <TableView points={result.series} unit={result.unit} />}
        {shape === "heatmap" && <HeatmapGrid points={result.series} unit={result.unit} />}
      </div>
    </div>
  );
}
