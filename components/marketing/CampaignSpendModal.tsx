"use client";

import { useActionState, useEffect } from "react";
import {
  type SpendActionState,
  upsertCampaignSpendAction,
} from "@/application/marketingAnalytics/spendActions";

const INITIAL_STATE: SpendActionState = { status: "idle" };

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function CampaignSpendModal({
  utmSource,
  utmCampaign,
  onClose,
}: {
  utmSource: string;
  utmCampaign: string;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(upsertCampaignSpendAction, INITIAL_STATE);

  // biome-ignore lint/correctness/useExhaustiveDependencies: onClose is intentionally excluded — including it would re-close the modal on every parent re-render that passes a new closure identity.
  useEffect(() => {
    if (state.status === "success") onClose();
  }, [state.status]);

  return (
    <>
      <button type="button" aria-label="Fechar" className="crm-modal-overlay" onClick={onClose} />
      <div className="crm-modal-center">
        <div
          className="crm-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Lançar investimento"
          style={{ maxWidth: 420 }}
        >
          <div className="crm-modal-head">
            <span className="crm-modal-title">Lançar investimento</span>
          </div>
          <form action={formAction} className="crm-modal-form">
            <input type="hidden" name="utmSource" value={utmSource} />
            <input type="hidden" name="utmCampaign" value={utmCampaign} />
            <div className="crm-field">
              <label htmlFor="spend-campaign-display">Campanha</label>
              <input id="spend-campaign-display" value={`${utmCampaign} · ${utmSource}`} disabled />
            </div>
            <div className="crm-field">
              <label htmlFor="spend-month">Mês de referência</label>
              <input
                id="spend-month"
                name="periodMonth"
                type="month"
                required
                defaultValue={currentMonthValue()}
              />
            </div>
            <div className="crm-field">
              <label htmlFor="spend-amount">Valor investido (R$)</label>
              <input id="spend-amount" name="amount" type="number" step="0.01" min="0" required />
            </div>
            <div className="crm-field">
              <label htmlFor="spend-notes">Notas (opcional)</label>
              <input id="spend-notes" name="notes" placeholder="Ex: campanha de lançamento" />
            </div>
            {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
            <div className="crm-modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-accent" disabled={pending}>
                {pending ? "Salvando…" : "Salvar investimento"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
