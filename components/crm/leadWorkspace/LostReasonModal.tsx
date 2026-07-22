"use client";

import { useState, useTransition } from "react";
import { markLeadLostAction } from "@/application/crm/leadsActions";
import { LOST_REASON_LABEL, LOST_REASONS } from "@/domain/crm/lostRules";
import type { LostReason } from "@/types/crm";

export function LostReasonModal({
  leadId,
  onClose,
  onDone,
}: {
  leadId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState<LostReason>("preco");
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await markLeadLostAction(leadId, reason);
      onDone();
    });
  }

  return (
    <>
      <button type="button" aria-label="Fechar" className="crm-modal-overlay" onClick={onClose} />
      <div className="crm-modal-center">
        <div
          className="crm-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Marcar como perdido"
          style={{ maxWidth: 420 }}
        >
          <div className="crm-modal-head">
            <span className="crm-modal-title">Marcar lead como perdido</span>
          </div>
          <div className="crm-modal-form">
            <div className="crm-field">
              <label htmlFor="lost-reason">Motivo da perda</label>
              <select
                id="lost-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as LostReason)}
              >
                {LOST_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {LOST_REASON_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="crm-modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-accent"
                disabled={isPending}
                onClick={handleConfirm}
              >
                {isPending ? "Salvando…" : "Marcar como perdido"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
