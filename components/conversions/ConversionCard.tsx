"use client";

import {
  CONVERSION_DELIVERY_STATUS_BADGE,
  CONVERSION_DESTINATION_LABEL,
  CONVERSION_TYPE_BADGE,
  CONVERSION_TYPE_LABEL,
} from "@/domain/conversions/types";
import { formatCurrencyBRL, formatDateTime } from "@/domain/crm/format";
import type { ConversionEvent } from "@/types/conversions";

export function ConversionCard({ event, onOpen }: { event: ConversionEvent; onOpen: () => void }) {
  return (
    <button type="button" className="crm-card crm-cv-card reveal in" onClick={onOpen}>
      <div className="crm-cv-card-head">
        <span className={`crm-badge ${CONVERSION_TYPE_BADGE[event.conversionType]}`}>
          {CONVERSION_TYPE_LABEL[event.conversionType]}
        </span>
        <span className="crm-card-sub" style={{ margin: 0 }}>
          {formatDateTime(event.occurredAt)}
        </span>
      </div>

      <div className="crm-cv-card-lead">{event.leadName ?? "Lead removido"}</div>
      <div className="crm-card-sub" style={{ margin: 0 }}>
        {event.origin}
        {event.value !== null ? ` · ${formatCurrencyBRL(event.value)}` : ""}
      </div>

      <div className="crm-cv-destinations">
        {event.deliveries.map((delivery) => (
          <span
            key={delivery.id}
            className={`crm-badge ${CONVERSION_DELIVERY_STATUS_BADGE[delivery.status]}`}
          >
            {CONVERSION_DESTINATION_LABEL[delivery.destination]}
          </span>
        ))}
      </div>
    </button>
  );
}
