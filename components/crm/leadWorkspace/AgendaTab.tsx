"use client";

import { useEffect, useState } from "react";
import { fetchOwnerOptions } from "@/application/crm/leadsActions";
import { AgendaEventDialog } from "@/components/agenda/AgendaEventDialog";
import { AgendaEventRow } from "@/components/agenda/AgendaEventRow";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AgendaEventDialogProvider,
  useAgendaEventDialog,
} from "@/contexts/agenda/AgendaEventDialogContext";
import { useLeadAgenda } from "@/hooks/agenda/useLeadAgenda";
import type { OwnerRef } from "@/types/crm";

function AgendaTabInner({ crmLeadId }: { crmLeadId: string }) {
  const { events, loading, reload } = useLeadAgenda(crmLeadId);
  const { openCreate } = useAgendaEventDialog();
  const [owners, setOwners] = useState<OwnerRef[]>([]);

  useEffect(() => {
    fetchOwnerOptions().then(setOwners);
  }, []);

  if (loading) {
    return (
      <div>
        <Skeleton style={{ height: 60, marginBottom: 10 }} />
        <Skeleton style={{ height: 60 }} />
      </div>
    );
  }

  return (
    <div className="crm-card crm-card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="crm-card-title">Agenda do lead</div>
        <button type="button" className="crm-ag-action-btn" onClick={() => openCreate(crmLeadId)}>
          Novo evento
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        {events.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">🗓️</EmptyMedia>
            <EmptyTitle>Nenhum evento agendado ainda</EmptyTitle>
            <EmptyDescription>
              Ligações, reuniões, follow-ups e propostas agendadas para este lead aparecem aqui em
              ordem cronológica.
            </EmptyDescription>
          </Empty>
        ) : (
          events.map((event) => (
            <AgendaEventRow key={event.id} event={event} showLead={false} onChanged={reload} />
          ))
        )}
      </div>

      <AgendaEventDialog owners={owners} onSaved={reload} />
    </div>
  );
}

export function AgendaTab({ crmLeadId }: { crmLeadId: string }) {
  return (
    <AgendaEventDialogProvider>
      <AgendaTabInner crmLeadId={crmLeadId} />
    </AgendaEventDialogProvider>
  );
}
