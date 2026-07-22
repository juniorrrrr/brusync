"use client";

import { useState } from "react";
import { NoResults } from "@/components/crm/NoResults";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import {
  IntegrationDrawer,
  type IntegrationDrawerMode,
} from "@/components/integrations/IntegrationDrawer";
import { IconArrowSwap } from "@/components/ui/icons";
import type { Integration } from "@/types/integrations";

export function IntegrationsBoard({ integrations }: { integrations: Integration[] }) {
  const [selected, setSelected] = useState<{
    provider: string;
    mode: IntegrationDrawerMode;
  } | null>(null);

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
            onConfigure={() => setSelected({ provider: integration.provider, mode: "config" })}
            onDetails={() => setSelected({ provider: integration.provider, mode: "details" })}
          />
        ))}
      </div>

      <IntegrationDrawer
        provider={selected?.provider ?? null}
        mode={selected?.mode ?? "details"}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
