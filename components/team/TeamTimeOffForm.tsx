"use client";

import { useActionState } from "react";
import {
  createTeamTimeOffAction,
  type TeamTimeOffActionState,
} from "@/application/team/teamTimeOffActions";
import { TIME_OFF_TYPE_LABEL } from "@/domain/team/statusMeta";
import type { TeamTimeOffType } from "@/types/team";

const INITIAL_STATE: TeamTimeOffActionState = { status: "idle" };
const TYPES: TeamTimeOffType[] = ["ferias", "licenca", "folga", "atestado"];

export function TeamTimeOffForm({ teamMemberId }: { teamMemberId: string }) {
  const [state, formAction] = useActionState(createTeamTimeOffAction, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="crm-composer-row"
      style={{ alignItems: "flex-end", flexWrap: "wrap" }}
    >
      <input type="hidden" name="teamMemberId" value={teamMemberId} />

      <div className="crm-field">
        <label htmlFor="time-off-type">Tipo</label>
        <select id="time-off-type" name="type" defaultValue="ferias">
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {TIME_OFF_TYPE_LABEL[type]}
            </option>
          ))}
        </select>
      </div>
      <div className="crm-field">
        <label htmlFor="time-off-start">Início</label>
        <input id="time-off-start" name="startDate" type="date" required />
      </div>
      <div className="crm-field">
        <label htmlFor="time-off-end">Fim</label>
        <input id="time-off-end" name="endDate" type="date" required />
      </div>
      <button type="submit" className="btn btn-outline">
        Registrar ausência
      </button>
      {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
    </form>
  );
}
