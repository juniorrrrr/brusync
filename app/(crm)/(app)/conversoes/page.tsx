import type { Metadata } from "next";
import { getConversionsHealthData } from "@/application/conversions/conversionHealthQueries";
import { getConversionsPageData } from "@/application/conversions/conversionsQueries";
import { BreakdownPanel } from "@/components/conversions/BreakdownPanel";
import { ConversionsBoard } from "@/components/conversions/ConversionsBoard";
import { ConversionsFilterBar } from "@/components/conversions/ConversionsFilterBar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { IconBolt, IconCheckCircle, IconClock, IconTarget } from "@/components/ui/icons";
import { CONVERSION_DESTINATION_LABEL } from "@/domain/conversions/types";
import type {
  ConversionDeliveryStatus,
  ConversionDestination,
  ConversionType,
} from "@/types/conversions";

export const metadata: Metadata = {
  title: "Conversões — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function ConversoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const [health, { events }] = await Promise.all([
    getConversionsHealthData(),
    getConversionsPageData({
      conversionType: params.type as ConversionType | undefined,
      destination: params.destination as ConversionDestination | undefined,
      status: params.status as ConversionDeliveryStatus | undefined,
      search: params.q,
      limit: 100,
    }),
  ]);

  return (
    <div>
      <div className="crm-kpi-grid">
        <KpiCard
          label="Quantidade de eventos"
          value={String(health.totalEvents)}
          icon={IconTarget}
        />
        <KpiCard
          label="Eventos pendentes"
          value={String(health.pendingDeliveries)}
          icon={IconClock}
        />
        <KpiCard
          label="Eventos enviados"
          value={String(health.sentDeliveries)}
          icon={IconCheckCircle}
        />
        <KpiCard label="Falhas" value={String(health.failedDeliveries)} icon={IconBolt} />
      </div>

      <div className="crm-row" style={{ marginTop: 16 }}>
        <BreakdownPanel
          title="Eventos por origem"
          subtitle="De onde, dentro do Brusync, cada evento nasceu"
          items={health.byOrigin.map((row) => ({ label: row.origin, count: row.count }))}
        />
        <BreakdownPanel
          title="Eventos por plataforma"
          subtitle="Fila de envio por destino"
          items={health.byDestination.map((row) => ({
            label: CONVERSION_DESTINATION_LABEL[row.destination],
            count: row.count,
          }))}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <ConversionsFilterBar />
      </div>
      <div style={{ marginTop: 16 }}>
        <ConversionsBoard events={events} />
      </div>
    </div>
  );
}
