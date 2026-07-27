"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import {
  configureIntegrationAction,
  fetchIntegrationDetail,
  type IntegrationDetail,
} from "@/application/integrations/integrationsActions";
import { GoogleEntityPicker } from "@/components/integrations/GoogleEntityPicker";
import { MetaConfigForm } from "@/components/integrations/MetaConfigForm";
import { ActivateToggleButton } from "@/components/integrationsCenter/ActivateToggleButton";
import { DisconnectButton } from "@/components/integrationsCenter/DisconnectButton";
import { SyncNowButton } from "@/components/integrationsCenter/SyncNowButton";
import { TestConnectionButton } from "@/components/integrationsCenter/TestConnectionButton";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { formatDateTime } from "@/domain/crm/format";
import { integrationLogEventLabel } from "@/domain/integrationsCenter/logEvents";
import {
  INTEGRATION_CATEGORY_LABEL,
  INTEGRATION_STATUS_BADGE,
  INTEGRATION_STATUS_LABEL,
} from "@/types/integrations";

const INITIAL_STATE = { status: "idle" as const };

export function IntegrationDrawer({
  provider,
  onClose,
}: {
  provider: string | null;
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

  // Re-fetches this same Drawer's own client-held detail (status, error,
  // Histórico) after Testar conexão/Salvar/Ativar — router.refresh() (called
  // by ActivateToggleButton) only re-renders the Server Component board
  // behind the Drawer, never this local state.
  const reload = useCallback(() => {
    if (!provider) return;
    fetchIntegrationDetail(provider).then(setDetail);
  }, [provider]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reload is intentionally excluded — it depends on provider, which is already the effect that resets detail above; this only needs to fire once when the generic Salvar form succeeds.
  useEffect(() => {
    if (formState.status === "success") reload();
  }, [formState]);

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
                  {detail.integration.lastSync ? formatDateTime(detail.integration.lastSync) : "—"}
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

              {detail.liveStatus && (
                <>
                  <div className="crm-ig-field">
                    <label htmlFor="ig-health">Saúde</label>
                    <span id="ig-health">
                      {detail.liveStatus.healthScore !== null
                        ? `${detail.liveStatus.healthScore}/100`
                        : "—"}
                    </span>
                  </div>
                  <div className="crm-ig-field">
                    <label htmlFor="ig-queue">Fila</label>
                    <span id="ig-queue">
                      {detail.liveStatus.queuedJobs > 0
                        ? `${detail.liveStatus.queuedJobs} sincronização(ões) pendente(s)`
                        : "Vazia"}
                    </span>
                  </div>
                  <div className="crm-ig-field">
                    <label htmlFor="ig-avg-duration">Tempo médio de sincronização</label>
                    <span id="ig-avg-duration">
                      {detail.liveStatus.averageDurationMs !== null
                        ? `${Math.round(detail.liveStatus.averageDurationMs / 1000)}s`
                        : "—"}
                    </span>
                  </div>
                  <div className="crm-ig-field">
                    <label htmlFor="ig-token-exp">Expiração do token</label>
                    <span id="ig-token-exp">
                      {detail.liveStatus.tokenExpiresAt
                        ? formatDateTime(detail.liveStatus.tokenExpiresAt)
                        : "—"}
                    </span>
                  </div>
                </>
              )}

              {detail.integration.provider === "meta_ads" ? (
                <MetaConfigForm onChanged={reload} />
              ) : detail.needsEntitySelection ? (
                <GoogleEntityPicker
                  provider={detail.integration.provider}
                  entities={detail.selectableEntities}
                  onSelected={reload}
                />
              ) : detail.connectUrl && detail.integration.status !== "conectado" ? (
                <div>
                  <p className="crm-ig-desc" style={{ marginBottom: 10 }}>
                    Conecte sua conta Google para começar a sincronizar.
                  </p>
                  <a
                    href={detail.connectUrl}
                    className="btn btn-accent"
                    style={{ display: "inline-block" }}
                  >
                    Conectar
                  </a>
                </div>
              ) : (
                <form action={formAction}>
                  <input type="hidden" name="provider" value={detail.integration.provider} />

                  <div className="crm-ig-field">
                    <label htmlFor="ig-notes">Credenciais / configuração</label>
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

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                    <TestConnectionButton
                      provider={detail.integration.provider}
                      onChanged={reload}
                    />
                    <button type="submit" className="crm-ig-action-btn">
                      Salvar
                    </button>
                    <ActivateToggleButton
                      provider={detail.integration.provider}
                      enabled={detail.integration.enabled}
                      onChanged={reload}
                    />
                    {detail.isImplemented && (
                      <SyncNowButton provider={detail.integration.provider} onChanged={reload} />
                    )}
                    {detail.isImplemented && detail.integration.status === "conectado" && (
                      <DisconnectButton provider={detail.integration.provider} onChanged={reload} />
                    )}
                  </div>
                </form>
              )}

              <div style={{ marginTop: 16 }}>
                <div className="crm-card-title" style={{ marginBottom: 8 }}>
                  Histórico
                </div>
                {detail.recentLogs.length === 0 && (
                  <p className="crm-ig-desc">Nenhum evento registrado ainda.</p>
                )}
                {detail.recentLogs.map((log) => (
                  <div key={log.id} className="crm-ig-log-row">
                    <span className={`crm-ig-log-dot ${log.status}`} />
                    <div>
                      <div>
                        <strong>{integrationLogEventLabel(log.event)}</strong> —{" "}
                        {formatDateTime(log.createdAt)}
                      </div>
                      {log.message && <div className="crm-card-sub">{log.message}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {detail.integration.provider === "meta_ads" && (
                <a
                  href="/integracoes/meta"
                  className="crm-ig-action-btn"
                  style={{ textAlign: "center", display: "block", marginTop: 12 }}
                >
                  Ver painel completo da Meta →
                </a>
              )}
              {detail.integration.provider === "meta_ads_manager" && (
                <a
                  href="/meta-ads/configuracoes"
                  className="crm-ig-action-btn"
                  style={{ textAlign: "center", display: "block", marginTop: 12 }}
                >
                  Ver painel completo do Meta Ads Manager →
                </a>
              )}
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
