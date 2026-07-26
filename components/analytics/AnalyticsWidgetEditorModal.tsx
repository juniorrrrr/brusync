"use client";

import { useActionState, useState } from "react";
import {
  ANALYTICS_ACTION_INITIAL_STATE,
  type AnalyticsActionState,
  addWidgetAction,
  updateWidgetAction,
} from "@/application/analytics/analyticsActions";
import { useAnalyticsWidgetEditor } from "@/contexts/analytics/AnalyticsWidgetEditorContext";
import {
  ANALYTICS_SOURCE_LABEL,
  ANALYTICS_SOURCES,
  metricsForSource,
} from "@/domain/analytics/metricsCatalog";
import {
  WIDGET_SIZE_LABEL,
  WIDGET_SIZES,
  WIDGET_TYPE_LABEL,
  WIDGET_TYPES,
} from "@/domain/analytics/statusMeta";
import type { AnalyticsDataSource } from "@/types/analytics";

export function AnalyticsWidgetEditorModal({ dashboardId }: { dashboardId: string }) {
  const { mode, editingWidget, close } = useAnalyticsWidgetEditor();
  const open = mode !== "closed";

  const [dataSource, setDataSource] = useState<AnalyticsDataSource>(
    editingWidget?.dataSource ?? ANALYTICS_SOURCES[0],
  );

  const [state, formAction] = useActionState(
    async (prev: AnalyticsActionState, formData: FormData) => {
      const result =
        mode === "edit"
          ? await updateWidgetAction(prev, formData)
          : await addWidgetAction(prev, formData);
      if (result.status === "success") close();
      return result;
    },
    ANALYTICS_ACTION_INITIAL_STATE,
  );

  if (!open) return null;

  const availableMetrics = metricsForSource(dataSource);

  return (
    <>
      <button type="button" aria-label="Fechar" className="crm-modal-overlay" onClick={close} />
      <div className="crm-modal-center">
        <div
          className="crm-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Widget"
          style={{ maxWidth: 520 }}
        >
          <div className="crm-modal-head">
            <span className="crm-modal-title">
              {mode === "create" ? "Adicionar widget" : "Editar widget"}
            </span>
          </div>

          <form action={formAction} className="crm-modal-form">
            <input type="hidden" name="dashboardId" value={dashboardId} />
            <input type="hidden" name="position" value={editingWidget?.position ?? 999} />
            {editingWidget && <input type="hidden" name="id" value={editingWidget.id} />}

            {mode === "create" && (
              <>
                <div className="crm-field">
                  <label htmlFor="widget-source">Fonte de dados *</label>
                  <select
                    id="widget-source"
                    name="dataSource"
                    value={dataSource}
                    onChange={(e) => setDataSource(e.target.value as AnalyticsDataSource)}
                  >
                    {ANALYTICS_SOURCES.map((source) => (
                      <option key={source} value={source}>
                        {ANALYTICS_SOURCE_LABEL[source]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="crm-field">
                  <label htmlFor="widget-metric">Métrica *</label>
                  <select id="widget-metric" name="metric" required>
                    {availableMetrics.map((entry) => (
                      <option key={entry.key} value={entry.key}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="crm-field">
                  <label htmlFor="widget-type">Tipo de widget *</label>
                  <select id="widget-type" name="type" defaultValue="kpi">
                    {WIDGET_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {WIDGET_TYPE_LABEL[type]}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="crm-field">
              <label htmlFor="widget-title">Título *</label>
              <input
                id="widget-title"
                name="title"
                required
                defaultValue={editingWidget?.title ?? ""}
              />
            </div>

            <div className="crm-field">
              <label htmlFor="widget-size">Tamanho</label>
              <select id="widget-size" name="size" defaultValue={editingWidget?.size ?? "medio"}>
                {WIDGET_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {WIDGET_SIZE_LABEL[size]}
                  </option>
                ))}
              </select>
            </div>

            {state.status === "error" && <div className="crm-field-error">{state.message}</div>}

            <div className="crm-modal-actions">
              <button type="button" className="btn btn-outline" onClick={close}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-accent">
                {mode === "create" ? "Adicionar" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
