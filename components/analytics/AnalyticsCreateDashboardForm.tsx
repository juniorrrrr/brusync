"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import {
  ANALYTICS_ACTION_INITIAL_STATE,
  createDashboardAction,
} from "@/application/analytics/analyticsActions";

export function AnalyticsCreateDashboardForm() {
  const [state, formAction] = useActionState(createDashboardAction, ANALYTICS_ACTION_INITIAL_STATE);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success" && state.dashboardId) {
      router.push(`/analytics/${state.dashboardId}`);
    }
  }, [state, router]);

  return (
    <form
      action={formAction}
      className="crm-card crm-card-pad crm-composer-row"
      style={{ alignItems: "flex-end" }}
    >
      <div className="crm-field">
        <label htmlFor="an-new-name">Nome do dashboard</label>
        <input id="an-new-name" name="name" placeholder="Ex.: Visão Comercial" required />
      </div>
      <div className="crm-field">
        <label htmlFor="an-new-description">Descrição</label>
        <input id="an-new-description" name="description" placeholder="Opcional" />
      </div>
      <button type="submit" className="btn btn-accent">
        Criar dashboard
      </button>
      {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
    </form>
  );
}
