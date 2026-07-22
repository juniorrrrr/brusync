"use client";

import { useEffect, useState } from "react";
import { fetchConversionEventsForLead } from "@/application/conversions/conversionsActions";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CONVERSION_DELIVERY_STATUS_BADGE,
  CONVERSION_DELIVERY_STATUS_LABEL,
  CONVERSION_DESTINATION_LABEL,
  CONVERSION_TYPE_BADGE,
  CONVERSION_TYPE_LABEL,
} from "@/domain/conversions/types";
import { formatDateTime } from "@/domain/crm/format";
import type { ConversionEvent } from "@/types/conversions";

function ConversionEventRow({ event }: { event: ConversionEvent }) {
  return (
    <div className="crm-tl-item">
      <span className="crm-tl-ico">
        <span
          className={`crm-badge ${CONVERSION_TYPE_BADGE[event.conversionType]}`}
          style={{ fontSize: 9 }}
        >
          {CONVERSION_TYPE_LABEL[event.conversionType]}
        </span>
      </span>
      <div>
        <div className="crm-tl-title">{CONVERSION_TYPE_LABEL[event.conversionType]}</div>
        <div className="crm-tl-meta">
          {formatDateTime(event.occurredAt)} · {event.actorName ?? "Sistema"}
        </div>
        <div className="crm-cv-destinations" style={{ marginTop: 6 }}>
          {event.deliveries.map((delivery) => (
            <span
              key={delivery.id}
              className={`crm-badge ${CONVERSION_DELIVERY_STATUS_BADGE[delivery.status]}`}
            >
              {CONVERSION_DESTINATION_LABEL[delivery.destination]} ·{" "}
              {CONVERSION_DELIVERY_STATUS_LABEL[delivery.status]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ConversionsTab({ crmLeadId }: { crmLeadId: string }) {
  const [events, setEvents] = useState<ConversionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchConversionEventsForLead(crmLeadId).then((data) => {
      if (!cancelled) {
        setEvents(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [crmLeadId]);

  if (loading) {
    return (
      <div>
        <Skeleton style={{ height: 60, marginBottom: 10 }} />
        <Skeleton style={{ height: 60 }} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Empty>
        <EmptyMedia variant="icon">🎯</EmptyMedia>
        <EmptyTitle>Nenhum evento de conversão ainda</EmptyTitle>
        <EmptyDescription>
          Eventos como Lead, Qualificado, Proposta, Venda e Cliente Ativado aparecem aqui conforme
          acontecem — prontos para futuramente serem enviados às plataformas de anúncio.
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="crm-card crm-card-pad">
      {events.map((event) => (
        <ConversionEventRow key={event.id} event={event} />
      ))}
    </div>
  );
}
