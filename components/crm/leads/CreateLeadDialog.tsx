"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { type ActionState, createLeadAction } from "@/application/crm/leadsActions";

const INITIAL_STATE: ActionState = { status: "idle" };

export function CreateLeadDialog({
  owners,
}: {
  owners: { id: string; name: string | null; email: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await createLeadAction(prev, fd);
    if (result.status === "success") {
      setOpen(false);
      router.refresh();
    }
    return result;
  }, INITIAL_STATE);

  return (
    <>
      <button type="button" className="btn btn-accent" onClick={() => setOpen(true)}>
        Novo Lead
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            className="crm-modal-overlay"
            onClick={() => setOpen(false)}
          />
          <div className="crm-modal-center">
            <div className="crm-modal" role="dialog" aria-modal="true" aria-label="Novo Lead">
              <div className="crm-modal-head">
                <span className="crm-modal-title">Novo Lead</span>
              </div>
              <form action={formAction} className="crm-modal-form">
                <div className="crm-field">
                  <label htmlFor="new-name">Nome *</label>
                  <input id="new-name" name="name" required />
                </div>
                <div className="crm-field">
                  <label htmlFor="new-company">Empresa</label>
                  <input id="new-company" name="company" />
                </div>
                <div className="crm-field">
                  <label htmlFor="new-email">E-mail</label>
                  <input id="new-email" name="email" type="email" />
                </div>
                <div className="crm-field">
                  <label htmlFor="new-phone">Telefone</label>
                  <input id="new-phone" name="phone" />
                </div>
                <div className="crm-field">
                  <label htmlFor="new-origin">Origem</label>
                  <input id="new-origin" name="origin" placeholder="Indicação, Instagram…" />
                </div>
                <div className="crm-field">
                  <label htmlFor="new-owner">Responsável</label>
                  <select id="new-owner" name="ownerId" defaultValue="">
                    <option value="">Sem responsável</option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name || owner.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="crm-field">
                  <label htmlFor="new-value">Valor potencial (R$)</label>
                  <input id="new-value" name="potentialValue" type="number" step="0.01" min="0" />
                </div>
                {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
                <div className="crm-modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-accent" disabled={pending}>
                    {pending ? "Criando…" : "Criar lead"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
