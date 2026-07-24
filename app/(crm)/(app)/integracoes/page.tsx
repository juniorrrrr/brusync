import type { Metadata } from "next";
import { getIntegrationHealthData } from "@/application/integrations/integrationHealthQueries";
import { getIntegrationsPageData } from "@/application/integrations/integrationsQueries";
import { IntegrationsBoard } from "@/components/integrations/IntegrationsBoard";
import { IntegrationsFilterBar } from "@/components/integrations/IntegrationsFilterBar";
import { IntegrationDashboardKpis } from "@/components/integrationsCenter/IntegrationDashboardKpis";
import type { IntegrationCategory, IntegrationStatus } from "@/types/integrations";

export const metadata: Metadata = {
  title: "Integrações — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function IntegracoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const [{ integrations }, health] = await Promise.all([
    getIntegrationsPageData({
      category: params.category as IntegrationCategory | undefined,
      status: params.status as IntegrationStatus | undefined,
      search: params.q,
    }),
    getIntegrationHealthData(),
  ]);

  return (
    <div>
      <IntegrationDashboardKpis health={health} />

      <div style={{ marginTop: 20 }}>
        <IntegrationsFilterBar />
      </div>
      <div style={{ marginTop: 16 }}>
        <IntegrationsBoard integrations={integrations} />
      </div>
    </div>
  );
}
