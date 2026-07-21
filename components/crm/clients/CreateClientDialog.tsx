"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { createClientAction } from "@/application/crm/clientsActions";
import type { ActionState } from "@/application/crm/leadsActions";

const INITIAL_STATE: ActionState = { status: "idle" };

export function CreateClientDialog({
  owners,
}: {
  owners: { id: string; name: string | null; email: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await createClientAction(prev, fd);
    if (result.status === "success") {
      setOpen(false);
      router.refresh();
    }
    return result;
  }, INITIAL_STATE);

  return (
    <>
      <button type="button" className="btn btn-accent" onClick={() => setOpen(true)}>
        Novo Cliente
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
            <div className="crm-modal" role="dialog" aria-modal="true" aria-label="Novo Cliente">
              <div className="crm-modal-head">
                <span className="crm-modal-title">Novo Cliente</span>
              </div>
              <form action={formAction} className="crm-modal-form">
                <div className="crm-field">
                  <label htmlFor="new-client-company">Empresa *</label>
                  <input id="new-client-company" name="company" required />
                </div>
                <div className="crm-field">
                  <label htmlFor="new-client-name">Contato principal</label>
                  <input id="new-client-name" name="name" />
                </div>
                <div className="crm-field">
                  <label htmlFor="new-client-email">E-mail</label>
                  <input id="new-client-email" name="email" type="email" />
                </div>
                <div className="crm-field">
                  <label htmlFor="new-client-phone">Telefone</label>
                  <input id="new-client-phone" name="phone" />
                </div>
                <div className="crm-field">
                  <label htmlFor="new-client-owner">Responsável</label>
                  <select id="new-client-owner" name="ownerId" defaultValue="">
                    <option value="">Sem responsável</option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name || owner.email}
                      </option>
                    ))}
                  </select>
                </div>
                {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
                <div className="crm-modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-accent" disabled={pending}>
                    {pending ? "Criando…" : "Criar cliente"}
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
