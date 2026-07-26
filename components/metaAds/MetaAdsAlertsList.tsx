import Link from "next/link";
import { ALERT_SEVERITY_LABEL, alertSeverityBadge } from "@/domain/metaAds/statusMeta";
import type { MetaAdsAlert } from "@/types/metaAds";

export function MetaAdsAlertsList({ alerts }: { alerts: MetaAdsAlert[] }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Alertas</div>
          <div className="crm-card-sub">
            {alerts.length} ativo{alerts.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      {alerts.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nenhum alerta no momento.
        </p>
      ) : (
        <div className="crm-mini-list">
          {alerts.slice(0, 10).map((alert, index) => {
            const row = (
              <>
                <span className="crm-mini-ico">•</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="crm-mini-title">{alert.title}</div>
                  <div className="crm-mini-meta">{alert.description}</div>
                </div>
                <span
                  className={`crm-badge ${alertSeverityBadge(alert.severity)}`}
                  style={{ fontSize: 10 }}
                >
                  {ALERT_SEVERITY_LABEL[alert.severity]}
                </span>
              </>
            );
            return alert.href ? (
              <Link
                key={`${alert.kind}-${alert.entityId ?? index}`}
                href={alert.href}
                className="crm-mini-row"
              >
                {row}
              </Link>
            ) : (
              <div key={`${alert.kind}-${alert.entityId ?? index}`} className="crm-mini-row">
                {row}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
