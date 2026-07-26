"use client";

import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";
import {
  connectWhatsappAccountAction,
  disconnectWhatsappAccountAction,
  reauthWhatsappAccountAction,
  WHATSAPP_ACCOUNT_ACTION_INITIAL_STATE,
} from "@/application/whatsapp/whatsappAccountActions";
import { ACCOUNT_STATUS_BADGE, ACCOUNT_STATUS_LABEL } from "@/domain/whatsapp/statusMeta";
import type { WhatsappAccount } from "@/types/whatsapp";

export function WhatsappAccountSettingsForm({ account }: { account: WhatsappAccount | null }) {
  const router = useRouter();
  const [connectState, connectAction] = useActionState(
    connectWhatsappAccountAction,
    WHATSAPP_ACCOUNT_ACTION_INITIAL_STATE,
  );
  const [isPending, startTransition] = useTransition();

  function reauth() {
    if (!account) return;
    startTransition(async () => {
      await reauthWhatsappAccountAction(account.id);
      router.refresh();
    });
  }

  function disconnect() {
    if (!account) return;
    startTransition(async () => {
      await disconnectWhatsappAccountAction(account.id);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {account && (
        <div className="crm-card crm-card-pad">
          <div className="crm-int-card-top">
            <div>
              <div className="crm-card-title">{account.displayName ?? account.phoneNumberId}</div>
              <p className="crm-card-sub">
                {account.displayPhoneNumber ?? account.phoneNumberId} · Última sincronização:{" "}
                {account.lastSyncAt
                  ? new Date(account.lastSyncAt).toLocaleString("pt-BR")
                  : "nunca"}
              </p>
            </div>
            <span className={`crm-badge ${ACCOUNT_STATUS_BADGE[account.status]}`}>
              {ACCOUNT_STATUS_LABEL[account.status]}
            </span>
          </div>
          {account.error && <p className="crm-field-error">{account.error}</p>}
          <div className="crm-int-card-actions">
            <button type="button" className="btn btn-outline" disabled={isPending} onClick={reauth}>
              Validar / Reautenticar
            </button>
            <button
              type="button"
              className="btn btn-outline"
              disabled={isPending}
              onClick={disconnect}
            >
              Desconectar
            </button>
          </div>
        </div>
      )}

      <form
        action={connectAction}
        className="crm-card crm-card-pad"
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <div className="crm-card-title">
          {account ? "Reconectar / atualizar credenciais" : "Conectar conta"}
        </div>
        <p className="crm-card-sub">
          Credenciais obtidas no Meta for Developers (App do WhatsApp Business). O Access Token, o
          Webhook Verify Token e o App Secret são armazenados cifrados (AES-256-GCM).
        </p>

        <div className="crm-field">
          <label htmlFor="wa-phone-number-id">Phone Number ID</label>
          <input id="wa-phone-number-id" name="phoneNumberId" required />
        </div>
        <div className="crm-field">
          <label htmlFor="wa-waba-id">Business Account ID (WABA)</label>
          <input id="wa-waba-id" name="wabaId" required />
        </div>
        <div className="crm-field">
          <label htmlFor="wa-access-token">Access Token</label>
          <input id="wa-access-token" name="accessToken" type="password" required />
        </div>
        <div className="crm-field">
          <label htmlFor="wa-verify-token">Webhook Verify Token</label>
          <input id="wa-verify-token" name="webhookVerifyToken" required />
        </div>
        <div className="crm-field">
          <label htmlFor="wa-app-secret">App Secret</label>
          <input id="wa-app-secret" name="appSecret" type="password" required />
        </div>

        <div>
          <p className="crm-card-sub">
            URL do webhook a cadastrar no Meta for Developers:{" "}
            <code>{"{origem-do-app}"}/api/webhooks/whatsapp</code>
          </p>
        </div>

        <div className="crm-modal-actions" style={{ justifyContent: "flex-start" }}>
          <button type="submit" className="btn btn-accent">
            {account ? "Atualizar credenciais" : "Conectar"}
          </button>
        </div>
        {connectState.status === "error" && (
          <div className="crm-field-error">{connectState.message}</div>
        )}
        {connectState.status === "success" && (
          <p className="crm-card-sub">{connectState.message}</p>
        )}
      </form>
    </div>
  );
}
