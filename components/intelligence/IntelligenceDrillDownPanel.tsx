"use client";

import { CategoryBadge } from "@/components/intelligence/CategoryBadge";
import { IconX } from "@/components/ui/icons";
import { useIntelligenceDrillDown } from "@/contexts/intelligence/IntelligenceDrillDownContext";
import {
  INTELLIGENCE_SEVERITY_LABEL,
  intelligenceSeverityBadge,
} from "@/domain/intelligence/types";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/** Mounted once at the module shell — reads whatever insight/alert was
 * opened via useIntelligenceDrillDown and renders its evidence directly
 * (no extra fetch: evidence already travelled with the item from the
 * dashboard query). This is the "abrir os dados que originaram aquela
 * informação" requirement, applied uniformly everywhere a card, feed item
 * or recommendation links back to its source. */
export function IntelligenceDrillDownPanel() {
  const { current, close } = useIntelligenceDrillDown();
  const open = current !== null;
  const item = current?.item;

  return (
    <>
      <button
        type="button"
        aria-label="Fechar"
        className={`crm-drawer-overlay${open ? " open" : ""}`}
        onClick={close}
      />
      <aside className={`crm-drawer${open ? " open" : ""}`} aria-hidden={!open}>
        {item && (
          <>
            <div className="crm-drawer-head">
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{item.title}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                  <CategoryBadge category={item.category} />
                  <span className={`crm-badge ${intelligenceSeverityBadge(item.severity)}`}>
                    {INTELLIGENCE_SEVERITY_LABEL[item.severity]}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="crm-drawer-close"
                onClick={close}
                aria-label="Fechar"
              >
                <IconX size={16} />
              </button>
            </div>

            <div className="crm-drawer-body">
              <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{item.description}</p>

              <div className="crm-drawer-section-title" style={{ marginTop: 16 }}>
                Dados que originaram este {current?.kind === "insight" ? "insight" : "alerta"}
              </div>
              {item.evidence.length === 0 ? (
                <p className="crm-card-sub">Sem evidência detalhada registrada.</p>
              ) : (
                <div className="crm-int-evidence-list">
                  {item.evidence.map((e, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: evidence rows have no stable id, position is the identity here
                    <div key={`${e.label}-${index}`} className="crm-int-evidence-row">
                      <span style={{ color: "var(--muted)" }}>{e.label}</span>
                      <span style={{ fontWeight: 600 }}>{e.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="crm-info-list" style={{ marginTop: 16 }}>
                <div className="crm-info-row">
                  <span className="crm-info-row-label">Criado em</span>
                  <span className="crm-info-row-value">{formatDateTime(item.createdAt)}</span>
                </div>
                {"periodFrom" in item && item.periodFrom && item.periodTo && (
                  <div className="crm-info-row">
                    <span className="crm-info-row-label">Período analisado</span>
                    <span className="crm-info-row-value">
                      {formatDateTime(item.periodFrom)} — {formatDateTime(item.periodTo)}
                    </span>
                  </div>
                )}
                {"acknowledgedByName" in item && item.acknowledgedByName && (
                  <div className="crm-info-row">
                    <span className="crm-info-row-label">Reconhecido por</span>
                    <span className="crm-info-row-value">{item.acknowledgedByName}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
