"use client";

import { useState } from "react";
import { disconnectMetaAdsAccountAction } from "@/application/metaAds/metaAdsAccountActions";
import { setAdAccountCrmLinkAction } from "@/application/metaAds/metaAdsCrmLinkActions";
import { formatDateTime } from "@/domain/crm/format";
import { ACCOUNT_STATUS_BADGE, ACCOUNT_STATUS_LABEL } from "@/domain/metaAds/statusMeta";
import type { MetaAccount, MetaAdAccount, MetaBusiness } from "@/types/metaAds";

export function MetaAdsAccountConnectPanel({
  account,
  businesses,
  adAccounts,
  clientOptions,
  responsibleOptions,
  oauthConfigured,
}: {
  account: MetaAccount | null;
  businesses: MetaBusiness[];
  adAccounts: MetaAdAccount[];
  clientOptions: { id: string; company: string }[];
  responsibleOptions: { id: string; name: string | null; email: string | null }[];
  oauthConfigured: boolean;
}) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleDisconnect() {
    if (!account) return;
    setDisconnecting(true);
    await disconnectMetaAdsAccountAction(account.id);
    setDisconnecting(false);
  }

  async function handleLink(adAccountId: string, clientId: string, responsibleId: string) {
    setSavingId(adAccountId);
    await setAdAccountCrmLinkAction(adAccountId, clientId || null, responsibleId || null);
    setSavingId(null);
  }

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Conexão com a Meta</div>
          <div className="crm-card-sub">
            {account ? account.name || account.metaUserId : "Nenhuma conta conectada"}
          </div>
        </div>
        {account && (
          <span className={`crm-badge ${ACCOUNT_STATUS_BADGE[account.status]}`}>
            {ACCOUNT_STATUS_LABEL[account.status]}
          </span>
        )}
      </div>

      {!oauthConfigured && (
        <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>
          META_ADS_APP_ID / META_ADS_APP_SECRET não configurados — cadastre um app da Meta com a
          Marketing API habilitada antes de conectar.
        </p>
      )}

      {account?.error && (
        <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>{account.error}</p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {oauthConfigured && (
          <a href="/api/meta-ads/oauth/start" className="btn btn-accent">
            {account?.status === "conectado" ? "Reconectar" : "Conectar com a Meta"}
          </a>
        )}
        {account && account.status === "conectado" && (
          <button
            type="button"
            className="crm-ig-action-btn"
            disabled={disconnecting}
            onClick={handleDisconnect}
          >
            {disconnecting ? "Desconectando…" : "Desconectar"}
          </button>
        )}
      </div>

      {account && (
        <div className="crm-ig-field" style={{ marginTop: 12 }}>
          <label htmlFor="meta-ads-last-sync">Última sincronização</label>
          <span id="meta-ads-last-sync">
            {account.lastSyncAt ? formatDateTime(account.lastSyncAt) : "—"}
          </span>
        </div>
      )}

      {businesses.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="crm-card-title" style={{ marginBottom: 8, fontSize: 14 }}>
            Business Managers
          </div>
          <div className="crm-mini-list">
            {businesses.map((b) => (
              <div key={b.id} className="crm-mini-row">
                <span className="crm-mini-ico">•</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="crm-mini-title">{b.name}</div>
                  <div className="crm-mini-meta">{b.verificationStatus ?? "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {adAccounts.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="crm-card-title" style={{ marginBottom: 8, fontSize: 14 }}>
            Contas de anúncios
          </div>
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Conta</th>
                  <th>Cliente</th>
                  <th>Responsável</th>
                </tr>
              </thead>
              <tbody>
                {adAccounts.map((adAccount) => (
                  <tr key={adAccount.id}>
                    <td className="cell-strong">{adAccount.name}</td>
                    <td>
                      <select
                        className="crm-select"
                        defaultValue={adAccount.clientId ?? ""}
                        disabled={savingId === adAccount.id}
                        onChange={(e) =>
                          handleLink(adAccount.id, e.target.value, adAccount.responsibleId ?? "")
                        }
                        aria-label={`Cliente vinculado a ${adAccount.name}`}
                      >
                        <option value="">Sem vínculo</option>
                        {clientOptions.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.company}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="crm-select"
                        defaultValue={adAccount.responsibleId ?? ""}
                        disabled={savingId === adAccount.id}
                        onChange={(e) =>
                          handleLink(adAccount.id, adAccount.clientId ?? "", e.target.value)
                        }
                        aria-label={`Responsável por ${adAccount.name}`}
                      >
                        <option value="">Sem responsável</option>
                        {responsibleOptions.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name ?? r.email ?? r.id}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
