import type { ReactNode } from "react";
import { MetaAdsSubNav } from "@/components/metaAds/MetaAdsSubNav";
import { MetaAdsFilterProvider } from "@/contexts/metaAds/MetaAdsFilterContext";

export default function MetaAdsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Meta Ads</h1>
          <p className="crm-page-sub">
            Marketing API oficial — contas, campanhas, criativos e públicos, sempre através do
            MetaAdsProvider.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <MetaAdsSubNav />
      </div>

      <MetaAdsFilterProvider>{children}</MetaAdsFilterProvider>
    </div>
  );
}
