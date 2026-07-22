"use client";

import { useState } from "react";
import { ConversionCard } from "@/components/conversions/ConversionCard";
import { ConversionDrawer } from "@/components/conversions/ConversionDrawer";
import { NoResults } from "@/components/crm/NoResults";
import { IconTarget } from "@/components/ui/icons";
import type { ConversionEvent } from "@/types/conversions";

export function ConversionsBoard({ events }: { events: ConversionEvent[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (events.length === 0) {
    return (
      <NoResults
        icon={IconTarget}
        title="Nenhum evento de conversão encontrado"
        description="Ajuste os filtros ou aguarde novos eventos do CRM."
      />
    );
  }

  return (
    <>
      <div className="crm-cv-grid">
        {events.map((event) => (
          <ConversionCard key={event.id} event={event} onOpen={() => setSelectedId(event.id)} />
        ))}
      </div>

      <ConversionDrawer eventId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}
