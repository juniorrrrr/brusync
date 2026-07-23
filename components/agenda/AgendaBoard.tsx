"use client";

import { useRouter } from "next/navigation";
import { AgendaEventDialog } from "@/components/agenda/AgendaEventDialog";
import { AgendaEventRow } from "@/components/agenda/AgendaEventRow";
import {
  AgendaEventDialogProvider,
  useAgendaEventDialog,
} from "@/contexts/agenda/AgendaEventDialogContext";
import type { AgendaEvent } from "@/types/agenda";
import type { OwnerRef } from "@/types/crm";

function AgendaBoardInner({
  events,
  owners,
  emptyText,
}: {
  events: AgendaEvent[];
  owners: OwnerRef[];
  emptyText: string;
}) {
  const router = useRouter();
  const { openCreate } = useAgendaEventDialog();

  function handleChanged() {
    router.refresh();
  }

  return (
    <div className="crm-card crm-card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="crm-card-title">Linha do tempo</div>
        <button type="button" className="btn btn-accent" onClick={() => openCreate()}>
          Novo evento
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        {events.length === 0 ? (
          <p className="crm-card-sub">{emptyText}</p>
        ) : (
          events.map((event) => (
            <AgendaEventRow key={event.id} event={event} onChanged={handleChanged} />
          ))
        )}
      </div>

      <AgendaEventDialog owners={owners} onSaved={handleChanged} />
    </div>
  );
}

export function AgendaBoard({
  events,
  owners,
  emptyText,
}: {
  events: AgendaEvent[];
  owners: OwnerRef[];
  emptyText: string;
}) {
  return (
    <AgendaEventDialogProvider>
      <AgendaBoardInner events={events} owners={owners} emptyText={emptyText} />
    </AgendaEventDialogProvider>
  );
}
