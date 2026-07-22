"use client";

import { useEffect, useState } from "react";
import {
  fetchMetaEventsForLead,
  resendMetaDeliveryAction,
} from "@/application/metaConversionsApi/metaActions";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CONVERSION_DELIVERY_STATUS_BADGE,
  CONVERSION_DELIVERY_STATUS_LABEL,
  CONVERSION_TYPE_BADGE,
  CONVERSION_TYPE_LABEL,
} from "@/domain/conversions/types";
import { formatDateTime } from "@/domain/crm/format";
import type { ConversionDeliveryAttempt } from "@/types/conversions";
import type { LeadMetaEvent } from "@/types/metaConversionsApi";

function eventIdFromAttempt(attempt: ConversionDeliveryAttempt): string | null {
  const payload = attempt.requestPayload as { data?: { event_id?: string }[] } | null;
  return payload?.data?.[0]?.event_id ?? null;
}

function MetaEventRow({
  event,
  onResent,
}: {
  event: LeadMetaEvent;
  onResent: (deliveryId: string) => void;
}) {
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setResending(true);
    setError(null);
    const result = await resendMetaDeliveryAction(event.deliveryId);
    setResending(false);
    if (!result.ok) {
      setError(result.error ?? "Falha ao reenviar.");
      return;
    }
    onResent(event.deliveryId);
  }

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
      <div style={{ flex: 1 }}>
        <div className="crm-tl-title">
          {CONVERSION_TYPE_LABEL[event.conversionType]}{" "}
          <span
            className={`crm-badge ${CONVERSION_DELIVERY_STATUS_BADGE[event.status as keyof typeof CONVERSION_DELIVERY_STATUS_BADGE]}`}
          >
            {CONVERSION_DELIVERY_STATUS_LABEL[
              event.status as keyof typeof CONVERSION_DELIVERY_STATUS_LABEL
            ] ?? event.status}
          </span>
        </div>
        <div className="crm-tl-meta">
          {formatDateTime(event.occurredAt)}
          {event.pixelId ? ` · Pixel ${event.pixelId}` : ""}
          {event.sentAt ? ` · Enviado em ${formatDateTime(event.sentAt)}` : ""}
        </div>

        {event.latestAttempt && (
          <div className="crm-card-sub" style={{ marginTop: 4 }}>
            {eventIdFromAttempt(event.latestAttempt) && (
              <>Event ID: {eventIdFromAttempt(event.latestAttempt)} · </>
            )}
            {event.latestAttempt.durationMs !== null ? `${event.latestAttempt.durationMs} ms` : ""}
            {event.latestAttempt.httpStatus !== null
              ? ` · HTTP ${event.latestAttempt.httpStatus}`
              : ""}
          </div>
        )}

        {event.lastError && (
          <div className="crm-card-sub" style={{ marginTop: 4, color: "var(--danger)" }}>
            {event.lastError}
          </div>
        )}

        {(event.status === "falhou" || event.lastError) && (
          <button
            type="button"
            className="crm-ig-action-btn"
            style={{ marginTop: 8, padding: "4px 10px", fontSize: 11 }}
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? "Reenviando…" : "Reenviar"}
          </button>
        )}
        {error && (
          <div className="crm-card-sub" style={{ marginTop: 4, color: "var(--danger)" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export function MetaTab({ crmLeadId }: { crmLeadId: string }) {
  const [events, setEvents] = useState<LeadMetaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadToken is an intentional cache-busting dependency, not read inside the effect body — it forces a refetch after a manual resend.
  useEffect(() => {
    let cancelled = false;
    fetchMetaEventsForLead(crmLeadId).then((data) => {
      if (!cancelled) {
        setEvents(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [crmLeadId, reloadToken]);

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
        <EmptyMedia variant="icon">📣</EmptyMedia>
        <EmptyTitle>Nenhum evento enviado à Meta ainda</EmptyTitle>
        <EmptyDescription>
          Conforme este lead evolui (qualificação, agendamento, proposta, venda), os eventos
          correspondentes são enviados automaticamente à Meta Conversions API e aparecem aqui.
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="crm-card crm-card-pad">
      {events.map((event) => (
        <MetaEventRow
          key={event.deliveryId}
          event={event}
          onResent={() => setReloadToken((t) => t + 1)}
        />
      ))}
    </div>
  );
}
