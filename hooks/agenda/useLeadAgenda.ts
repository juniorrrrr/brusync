"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAgendaEventsForLead } from "@/application/agenda/agendaActions";
import type { AgendaEvent } from "@/types/agenda";

/** Client-side data source for the Lead Workspace's Agenda tab — reloaded
 * after the create/complete/cancel dialog closes with a change, same
 * reload-on-demand shape as hooks/automation/useWorkflowsList.ts. */
export function useLeadAgenda(crmLeadId: string) {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    fetchAgendaEventsForLead(crmLeadId)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [crmLeadId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { events, loading, reload };
}
