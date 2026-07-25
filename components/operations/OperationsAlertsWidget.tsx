import Link from "next/link";
import {
  INTELLIGENCE_SEVERITY_LABEL,
  intelligenceSeverityBadge,
} from "@/domain/intelligence/types";
import type { IntelligenceAlert } from "@/types/intelligence";

export function OperationsAlertsWidget({ alerts }: { alerts: IntelligenceAlert[] }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Alertas críticos</div>
          <div className="crm-card-sub">
            Da Central de Inteligência — {alerts.length} ativo{alerts.length === 1 ? "" : "s"}
          </div>
        </div>
        <Link href="/inteligencia" className="btn btn-outline">
          Ver tudo
        </Link>
      </div>
      {alerts.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nenhum alerta crítico no momento.
        </p>
      ) : (
        <div className="crm-mini-list">
          {alerts.slice(0, 8).map((alert) => (
            <Link key={alert.id} href="/inteligencia" className="crm-mini-row">
              <span className="crm-mini-ico">•</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="crm-mini-title">{alert.title}</div>
                <div className="crm-mini-meta">{alert.description}</div>
              </div>
              <span
                className={`crm-badge ${intelligenceSeverityBadge(alert.severity)}`}
                style={{ fontSize: 10 }}
              >
                {INTELLIGENCE_SEVERITY_LABEL[alert.severity]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
