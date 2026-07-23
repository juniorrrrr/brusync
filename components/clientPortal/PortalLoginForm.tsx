"use client";

import { useActionState } from "react";
import {
  type PortalLoginFormState,
  portalSignInAction,
} from "@/application/clientPortal/portalAuthActions";

const initialState: PortalLoginFormState = { status: "idle" };

export function PortalLoginForm() {
  const [state, formAction, isPending] = useActionState(portalSignInAction, initialState);

  return (
    <form className="crm-login-form" action={formAction}>
      {state.status === "error" && <div className="crm-login-error">{state.message}</div>}

      <div className="crm-field">
        <label htmlFor="portal-email">E-mail</label>
        <input
          id="portal-email"
          name="email"
          type="email"
          placeholder="voce@empresa.com"
          required
        />
      </div>

      <div className="crm-field">
        <label htmlFor="portal-password">Senha</label>
        <input
          id="portal-password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
        />
      </div>

      <button type="submit" className="btn btn-accent" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
