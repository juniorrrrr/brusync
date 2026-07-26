"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  decideApprovalAction,
  requestApprovalAction,
} from "@/application/processes/processesActions";
import {
  PROCESS_APPROVAL_STATUS_BADGE,
  PROCESS_APPROVAL_STATUS_LABEL,
} from "@/domain/processes/statusMeta";
import type { ProcessApproval } from "@/types/processes";

/** Aprovação do processo inteiro (não de uma etapa específica) — qualquer
 * membro da equipe interna pode decidir, mesmo modelo de visibilidade "toda a
 * equipe" já usado no resto da plataforma (sem papel dedicado de aprovador). */
export function ApprovalPanel({
  processId,
  approvals,
}: {
  processId: string;
  approvals: ProcessApproval[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const hasPending = approvals.some((a) => a.status === "pendente");

  function handleRequest() {
    startTransition(async () => {
      await requestApprovalAction(processId, null, notes);
      setNotes("");
      router.refresh();
    });
  }

  function handleDecide(approvalId: string, decision: "aprovado" | "reprovado") {
    startTransition(async () => {
      await decideApprovalAction(approvalId, processId, decision, "");
      router.refresh();
    });
  }

  return (
    <div className="crm-card crm-card-pad">
      <div className="crm-card-title">Aprovações</div>
      <div className="crm-int-grid" style={{ marginTop: 8 }}>
        {approvals.map((approval) => (
          <div key={approval.id} className="crm-int-card-row">
            <div className="crm-int-card-top">
              <div>
                <div className="crm-int-card-title">
                  {approval.stepName ? `Etapa: ${approval.stepName}` : "Processo inteiro"}
                </div>
                <div className="crm-int-card-desc">
                  Solicitado por {approval.requestedByName ?? "—"}
                  {approval.approverName ? ` · Decidido por ${approval.approverName}` : ""}
                </div>
              </div>
              <span className={`crm-badge ${PROCESS_APPROVAL_STATUS_BADGE[approval.status]}`}>
                {PROCESS_APPROVAL_STATUS_LABEL[approval.status]}
              </span>
            </div>
            {approval.notes && <p className="crm-card-sub">{approval.notes}</p>}
            {approval.status === "pendente" && (
              <div className="crm-int-card-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={isPending}
                  onClick={() => handleDecide(approval.id, "aprovado")}
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={isPending}
                  onClick={() => handleDecide(approval.id, "reprovado")}
                >
                  Reprovar
                </button>
              </div>
            )}
          </div>
        ))}
        {approvals.length === 0 && (
          <p className="crm-card-sub">Nenhuma aprovação solicitada ainda.</p>
        )}
      </div>

      {!hasPending && (
        <div className="crm-composer-row" style={{ marginTop: 12 }}>
          <input
            placeholder="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline"
            disabled={isPending}
            onClick={handleRequest}
          >
            Solicitar aprovação
          </button>
        </div>
      )}
    </div>
  );
}
