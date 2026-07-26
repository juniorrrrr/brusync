"use client";

import { useActionState, useState } from "react";
import {
  ANALYTICS_ACTION_INITIAL_STATE,
  createSnapshotAction,
} from "@/application/analytics/analyticsActions";
import type { AnalyticsSnapshot } from "@/types/analytics";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function AnalyticsSnapshotPanel({
  dashboardId,
  snapshots,
}: {
  dashboardId: string;
  snapshots: AnalyticsSnapshot[];
}) {
  const [state, formAction] = useActionState(createSnapshotAction, ANALYTICS_ACTION_INITIAL_STATE);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  function toggleCompare(id: string) {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 2
          ? [...prev, id]
          : [prev[1], id],
    );
  }

  const compared = snapshots.filter((s) => compareIds.includes(s.id));

  return (
    <div className="crm-card crm-card-pad">
      <div className="crm-card-title">Snapshots</div>
      <p className="crm-card-sub">
        Guarda só a configuração do dashboard num momento — comparar reroda os widgets com os dados
        de hoje.
      </p>

      <form action={formAction} className="crm-composer-row" style={{ marginTop: 10 }}>
        <input type="hidden" name="dashboardId" value={dashboardId} />
        <input name="label" placeholder="Nome do snapshot (ex.: Início do mês)" required />
        <button type="submit" className="btn btn-outline">
          Salvar snapshot
        </button>
      </form>
      {state.status === "error" && <div className="crm-field-error">{state.message}</div>}

      <div className="crm-mini-list" style={{ marginTop: 10 }}>
        {snapshots.map((snapshot) => (
          <label key={snapshot.id} className="crm-an-row" style={{ cursor: "pointer" }}>
            <span>
              <input
                type="checkbox"
                checked={compareIds.includes(snapshot.id)}
                onChange={() => toggleCompare(snapshot.id)}
                style={{ marginRight: 8 }}
              />
              {snapshot.label}
            </span>
            <span className="crm-card-sub">
              {snapshot.createdByName ?? "—"} · {formatDate(snapshot.createdAt)}
            </span>
          </label>
        ))}
        {snapshots.length === 0 && <p className="crm-card-sub">Nenhum snapshot salvo ainda.</p>}
      </div>

      {compared.length === 2 && (
        <div className="crm-an-compare">
          {compared.map((snapshot) => (
            <div key={snapshot.id} className="crm-an-compare-col">
              <div className="crm-card-title">{snapshot.label}</div>
              <p className="crm-card-sub">{formatDate(snapshot.createdAt)}</p>
              <div className="crm-mini-list">
                {snapshot.state.widgets.map((widget) => (
                  <div key={widget.id} className="crm-an-row">
                    <span>{widget.title}</span>
                    <span className="crm-card-sub">{widget.type}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
