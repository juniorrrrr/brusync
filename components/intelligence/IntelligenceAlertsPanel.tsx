import { IntelligenceAlertCard } from "@/components/intelligence/IntelligenceAlertCard";
import type { IntelligenceAlert } from "@/types/intelligence";

export function IntelligenceAlertsPanel({ alerts }: { alerts: IntelligenceAlert[] }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Alertas</div>
          <div className="crm-card-sub">
            Situações que exigem ação — {alerts.length} ativo{alerts.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      {alerts.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nenhum alerta ativo no momento.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          {alerts.map((alert) => (
            <IntelligenceAlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
