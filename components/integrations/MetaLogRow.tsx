"use client";

import { useState } from "react";
import { CONVERSION_TYPE_LABEL } from "@/domain/conversions/types";
import { formatDateTime } from "@/domain/crm/format";
import type { AttemptsPage } from "@/repositories/conversions/conversionDeliveryAttemptsRepository";

type MetaLogEntry = AttemptsPage["attempts"][number];

export function MetaLogRow({ entry }: { entry: MetaLogEntry }) {
  const [expanded, setExpanded] = useState<"payload" | "response" | null>(null);

  return (
    <div className="crm-ig-log-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div style={{ display: "flex", gap: 10 }}>
        <span className={`crm-ig-log-dot ${entry.status === "sucesso" ? "success" : "error"}`} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>
              {CONVERSION_TYPE_LABEL[entry.conversionType as keyof typeof CONVERSION_TYPE_LABEL] ??
                entry.conversionType}{" "}
              · {entry.leadName ?? "Lead removido"}
            </strong>
            <span className="crm-card-sub" style={{ margin: 0 }}>
              {formatDateTime(entry.createdAt)}
            </span>
          </div>
          <div className="crm-card-sub" style={{ marginTop: 2 }}>
            {entry.status === "sucesso" ? "Sucesso" : "Erro"}
            {entry.durationMs !== null ? ` · ${entry.durationMs} ms` : ""}
            {entry.httpStatus !== null ? ` · HTTP ${entry.httpStatus}` : ""}
          </div>
          {entry.message && <div className="crm-tl-body">{entry.message}</div>}

          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button
              type="button"
              className="crm-ig-action-btn"
              style={{ flex: "0 0 auto", padding: "4px 10px", fontSize: 11 }}
              onClick={() => setExpanded(expanded === "payload" ? null : "payload")}
            >
              {expanded === "payload" ? "Ocultar payload" : "Ver payload enviado"}
            </button>
            <button
              type="button"
              className="crm-ig-action-btn"
              style={{ flex: "0 0 auto", padding: "4px 10px", fontSize: 11 }}
              onClick={() => setExpanded(expanded === "response" ? null : "response")}
            >
              {expanded === "response" ? "Ocultar resposta" : "Ver resposta da Meta"}
            </button>
          </div>

          {expanded && (
            <pre
              style={{
                marginTop: 8,
                background: "var(--surface)",
                borderRadius: 8,
                padding: 10,
                fontSize: 11,
                overflowX: "auto",
                maxHeight: 260,
              }}
            >
              {JSON.stringify(
                expanded === "payload" ? entry.requestPayload : entry.responseBody,
                null,
                2,
              )}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
