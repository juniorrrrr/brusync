"use client";

import { useState } from "react";
import { NoResults } from "@/components/crm/NoResults";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { IntegrationDrawer } from "@/components/integrations/IntegrationDrawer";
import { IconArrowSwap } from "@/components/ui/icons";
import type { Integration } from "@/types/integrations";

export function IntegrationsBoard({ integrations }: { integrations: Integration[] }) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  if (integrations.length === 0) {
    return (
      <NoResults
        icon={IconArrowSwap}
        title="Nenhuma integração encontrada"
        description="Ajuste os filtros para ver outras integrações do catálogo."
      />
    );
  }

  return (
    <>
      <div className="crm-ig-grid">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConfigure={() => setSelectedProvider(integration.provider)}
          />
        ))}
      </div>

      <IntegrationDrawer provider={selectedProvider} onClose={() => setSelectedProvider(null)} />
    </>
  );
}
