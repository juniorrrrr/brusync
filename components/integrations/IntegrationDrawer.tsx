"use client";

import { useActionState, useEffect, useState } from "react";
import {
  configureIntegrationAction,
  fetchIntegrationDetail,
  type IntegrationDetail,
} from "@/application/integrations/integrationsActions";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { formatDateTime } from "@/domain/crm/format";
import {
  INTEGRATION_CATEGORY_LABEL,
  INTEGRATION_STATUS_BADGE,
  INTEGRATION_STATUS_LABEL,
} from "@/types/integrations";

export type IntegrationDrawerMode = "config" | "details";

const INITIAL_STATE = { status: "idle" as const };

export function IntegrationDrawer({
  provider,
  mode,
  onClose,
}: {
  provider: string | null;
  mode: IntegrationDrawerMode;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<IntegrationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [formState, formAction] = useActionState(configureIntegrationAction, INITIAL_STATE);

  useEffect(() => {
    if (!provider) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchIntegrationDetail(provider).then((result) => {
      if (!cancelled) {
        setDetail(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [provider]);

  const open = provider !== null;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      direction="right"
    >
      <DrawerContent className="crm-ig-drawer">
        {loading && <div className="crm-drawer-loading">Carregando…</div>}
        {!loading && !detail && open && (
          <div className="crm-drawer-empty">Integração não encontrada.</div>
        )}
        {!loading && detail && (
          <>
            <div className="crm-ig-drawer-head">
              <div>
                <DrawerTitle>{detail.integration.name}</DrawerTitle>
                <div className="crm-card-sub">
                  {INTEGRATION_CATEGORY_LABEL[detail.integration.category]}
                </div>
              </div>
              <span className={`crm-badge ${INTEGRATION_STATUS_BADGE[detail.integration.status]}`}>
                {INTEGRATION_STATUS_LABEL[detail.integration.status]}
              </span>
            </div>

            {mode === "details" && (
              <div className="crm-ig-drawer-body">
                <p className="crm-ig-desc">{detail.integration.description}</p>

                <div className="crm-ig-field">
                  <label htmlFor="ig-connected-at">Conectado em</label>
                  <span id="ig-connected-at">
                    {detail.integration.connectedAt
                      ? formatDateTime(detail.integration.connectedAt)
                      : "—"}
                  </span>
                </div>
                <div className="crm-ig-field">
                  <label htmlFor="ig-last-sync">Última sincronização</label>
                  <span id="ig-last-sync">
                    {detail.integration.lastSync
                      ? formatDateTime(detail.integration.lastSync)
                      : "—"}
                  </span>
                </div>
                <div className="crm-ig-field">
                  <label htmlFor="ig-health">Health score</label>
                  <span id="ig-health">
                    {detail.integration.healthScore !== null
                      ? `${detail.integration.healthScore}/100`
                      : "Sem dados suficientes"}
                  </span>
                </div>
                {detail.integration.error && (
                  <div className="crm-ig-field">
                    <label htmlFor="ig-error">Último erro</label>
                    <span id="ig-error" style={{ color: "var(--danger)" }}>
                      {detail.integration.error}
                    </span>
                  </div>
                )}

                <div>
                  <div className="crm-card-title" style={{ marginBottom: 8 }}>
                    Logs recentes
                  </div>
                  {detail.recentLogs.length === 0 && (
                    <p className="crm-ig-desc">Nenhum log registrado ainda.</p>
                  )}
                  {detail.recentLogs.map((log) => (
                    <div key={log.id} className="crm-ig-log-row">
                      <span className={`crm-ig-log-dot ${log.status}`} />
                      <div>
                        <div>
                          <strong>{log.event}</strong> — {formatDateTime(log.createdAt)}
                        </div>
                        {log.message && <div className="crm-card-sub">{log.message}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mode === "config" && (
              <form action={formAction} className="crm-ig-drawer-body">
                <input type="hidden" name="provider" value={detail.integration.provider} />

                <div className="crm-ig-field">
                  <label htmlFor="ig-enabled-toggle">Ativada</label>
                  <label
                    htmlFor="ig-enabled-toggle"
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Switch
                      id="ig-enabled-toggle"
                      name="enabled"
                      defaultChecked={detail.integration.enabled}
                    />
                    <span className="crm-card-sub" style={{ margin: 0 }}>
                      Habilitar esta integração quando ela estiver disponível
                    </span>
                  </label>
                </div>

                <div className="crm-ig-field">
                  <label htmlFor="ig-notes">Notas / configuração</label>
                  <textarea
                    id="ig-notes"
                    name="notes"
                    className="crm-select"
                    rows={4}
                    style={{ width: "100%", resize: "vertical" }}
                    defaultValue={
                      typeof detail.integration.config.notes === "string"
                        ? detail.integration.config.notes
                        : ""
                    }
                    placeholder="Nenhuma credencial real é usada nesta fase — use este campo para anotações."
                  />
                </div>

                {formState.status === "error" && (
                  <p style={{ color: "var(--danger)", fontSize: 13 }}>{formState.message}</p>
                )}
                {formState.status === "success" && (
                  <p style={{ color: "#1fa971", fontSize: 13 }}>{formState.message}</p>
                )}

                <button type="submit" className="crm-ig-action-btn">
                  Salvar
                </button>
              </form>
            )}
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
