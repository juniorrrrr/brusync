import type { Metadata } from "next";
import { getIntegrationsPageData } from "@/application/integrations/integrationsQueries";
import { IntegrationsBoard } from "@/components/integrations/IntegrationsBoard";
import { IntegrationsFilterBar } from "@/components/integrations/IntegrationsFilterBar";
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

  const { integrations } = await getIntegrationsPageData({
    category: params.category as IntegrationCategory | undefined,
    status: params.status as IntegrationStatus | undefined,
    search: params.q,
  });

  return (
    <div>
      <IntegrationsFilterBar />
      <div style={{ marginTop: 16 }}>
        <IntegrationsBoard integrations={integrations} />
      </div>
    </div>
  );
}
