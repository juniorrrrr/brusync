"use client";

import { useActionState } from "react";
import { type LoginFormState, signIn } from "@/services/auth/login";

const initialState: LoginFormState = { status: "idle" };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <form className="crm-login-form" action={formAction}>
      <input type="hidden" name="next" value={next} />

      {state.status === "error" && <div className="crm-login-error">{state.message}</div>}

      <div className="crm-field">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" placeholder="voce@brusync.com" required />
      </div>

      <div className="crm-field">
        <label htmlFor="password">Senha</label>
        <input id="password" name="password" type="password" placeholder="••••••••" required />
      </div>

      <button type="submit" className="btn btn-accent" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
