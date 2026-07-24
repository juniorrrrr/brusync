"use client";

import { ProviderLogo } from "@/components/integrations/logos";
import { ActivateToggleButton } from "@/components/integrationsCenter/ActivateToggleButton";
import { TestConnectionButton } from "@/components/integrationsCenter/TestConnectionButton";
import { formatDate } from "@/domain/crm/format";
import {
  INTEGRATION_CATEGORY_LABEL,
  INTEGRATION_STATUS_BADGE,
  INTEGRATION_STATUS_LABEL,
  type Integration,
} from "@/types/integrations";

export function IntegrationCard({
  integration,
  onConfigure,
}: {
  integration: Integration;
  onConfigure: () => void;
}) {
  return (
    <div className="crm-card crm-ig-card reveal in">
      <div className="crm-ig-card-head">
        <div className="crm-ig-identity">
          <span className="crm-ig-logo">
            <ProviderLogo provider={integration.provider} category={integration.category} />
          </span>
          <div>
            <div className="crm-ig-name">{integration.name}</div>
            <div className="crm-ig-category">
              {INTEGRATION_CATEGORY_LABEL[integration.category]}
            </div>
          </div>
        </div>
        <span className={`crm-badge ${INTEGRATION_STATUS_BADGE[integration.status]}`}>
          {INTEGRATION_STATUS_LABEL[integration.status]}
        </span>
      </div>

      <p className="crm-ig-desc">{integration.description}</p>

      <div className="crm-ig-meta">
        <span>Última sincronização</span>
        <span>{integration.lastSync ? formatDate(integration.lastSync) : "—"}</span>
      </div>

      <div className="crm-ig-actions">
        <button type="button" className="crm-ig-action-btn" onClick={onConfigure}>
          Configurar
        </button>
        <ActivateToggleButton provider={integration.provider} enabled={integration.enabled} />
        <a
          href={`/integracoes/logs?provider=${integration.provider}`}
          className="crm-ig-action-btn"
        >
          Logs
        </a>
      </div>

      <div style={{ marginTop: 8 }}>
        <TestConnectionButton provider={integration.provider} />
      </div>
    </div>
  );
}
