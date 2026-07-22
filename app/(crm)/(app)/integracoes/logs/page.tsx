import type { Metadata } from "next";
import { getIntegrationLogsPageData } from "@/application/integrations/integrationLogsQueries";
import { getIntegrationsPageData } from "@/application/integrations/integrationsQueries";
import { LogsFilterBar } from "@/components/integrations/LogsFilterBar";
import { LogsTimeline } from "@/components/integrations/LogsTimeline";
import type { IntegrationLogStatus } from "@/types/integrations";

export const metadata: Metadata = {
  title: "Logs de Integrações — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function IntegracoesLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const [{ integrations }, { logs, total }] = await Promise.all([
    getIntegrationsPageData(),
    getIntegrationLogsPageData({
      provider: params.provider,
      status: params.status as IntegrationLogStatus | undefined,
      search: params.q,
      limit: 100,
    }),
  ]);

  const providerOptions = integrations.map((integration) => ({
    value: integration.provider,
    label: integration.name,
  }));

  return (
    <div>
      <LogsFilterBar providerOptions={providerOptions} />
      <p className="crm-page-sub" style={{ margin: "12px 0" }}>
        {total} {total === 1 ? "registro" : "registros"}
      </p>
      <LogsTimeline logs={logs} />
    </div>
  );
}
