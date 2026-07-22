"use client";

import { useEffect, useState } from "react";
import { fetchConversionEventDetail } from "@/application/conversions/conversionsActions";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  CONVERSION_DELIVERY_STATUS_BADGE,
  CONVERSION_DELIVERY_STATUS_LABEL,
  CONVERSION_DESTINATION_LABEL,
  CONVERSION_TYPE_BADGE,
  CONVERSION_TYPE_LABEL,
} from "@/domain/conversions/types";
import { formatCurrencyBRL, formatDateTime } from "@/domain/crm/format";
import { campaignDisplayName } from "@/domain/marketing/campaignKey";
import type { ConversionEventDetail } from "@/types/conversions";

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="crm-ws-row">
      <span className="crm-ws-row-label">{label}</span>
      <span className="crm-ws-row-value">{value}</span>
    </div>
  );
}

export function ConversionDrawer({
  eventId,
  onClose,
}: {
  eventId: string | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<ConversionEventDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchConversionEventDetail(eventId).then((result) => {
      if (!cancelled) {
        setDetail(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const open = eventId !== null;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      direction="right"
    >
      <DrawerContent className="crm-ig-drawer">
        {loading && <div className="crm-drawer-loading">Carregando…</div>}
        {!loading && !detail && open && (
          <div className="crm-drawer-empty">Evento não encontrado.</div>
        )}
        {!loading && detail && (
          <>
            <div className="crm-ig-drawer-head">
              <div>
                <DrawerTitle>{CONVERSION_TYPE_LABEL[detail.conversionType]}</DrawerTitle>
                <div className="crm-card-sub">{detail.leadName ?? "Lead removido"}</div>
              </div>
              <span className={`crm-badge ${CONVERSION_TYPE_BADGE[detail.conversionType]}`}>
                {detail.ready ? "Pronto para envio" : "Incompleto"}
              </span>
            </div>

            <div className="crm-ig-drawer-body">
              <Row label="Origem" value={detail.origin} />
              <Row label="Data" value={formatDateTime(detail.occurredAt)} />
              <Row label="Responsável" value={detail.actorName} />
              <Row label="Cliente" value={detail.clientName} />
              <Row
                label="Valor"
                value={
                  detail.value !== null
                    ? `${formatCurrencyBRL(detail.value)} ${detail.currency}`
                    : null
                }
              />
              <Row
                label="Campanha"
                value={
                  detail.utmSource || detail.utmCampaign
                    ? campaignDisplayName({
                        utmSource: detail.utmSource,
                        utmCampaign: detail.utmCampaign,
                      })
                    : null
                }
              />
              <Row label="UTM Source" value={detail.utmSource} />
              <Row label="UTM Medium" value={detail.utmMedium} />
              <Row label="UTM Campaign" value={detail.utmCampaign} />
              <Row label="UTM Content" value={detail.utmContent} />
              <Row label="UTM Term" value={detail.utmTerm} />
              <Row label="GCLID" value={detail.gclid} />
              <Row label="FBCLID" value={detail.fbclid} />
              <Row label="MSCLKID" value={detail.msclkid} />
              <Row label="TTCLID" value={detail.ttclid} />

              <div>
                <div className="crm-card-title" style={{ marginBottom: 8, marginTop: 8 }}>
                  Destinos
                </div>
                {detail.deliveries.map((delivery) => (
                  <div key={delivery.id} className="crm-ig-log-row">
                    <span
                      className={`crm-ig-log-dot ${delivery.status === "enviado" ? "success" : delivery.status === "falhou" ? "error" : "pending"}`}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong>{CONVERSION_DESTINATION_LABEL[delivery.destination]}</strong>
                        <span
                          className={`crm-badge ${CONVERSION_DELIVERY_STATUS_BADGE[delivery.status]}`}
                        >
                          {CONVERSION_DELIVERY_STATUS_LABEL[delivery.status]}
                        </span>
                      </div>
                      <div className="crm-card-sub">
                        {delivery.attempts} tentativa{delivery.attempts === 1 ? "" : "s"}
                        {delivery.lastError ? ` · ${delivery.lastError}` : ""}
                      </div>
                      {(detail.attemptsByDelivery[delivery.id] ?? []).map((attempt) => (
                        <div key={attempt.id} className="crm-card-sub" style={{ marginTop: 4 }}>
                          {formatDateTime(attempt.createdAt)} · {attempt.status}
                          {attempt.message ? ` · ${attempt.message}` : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
