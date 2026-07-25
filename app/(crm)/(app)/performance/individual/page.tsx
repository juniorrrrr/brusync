import type { Metadata } from "next";
import { fetchPerformanceIndividualData } from "@/application/performance/performanceQueries";
import { OwnerFilterSelect } from "@/components/performance/OwnerFilterSelect";
import { ScorecardPanel } from "@/components/performance/ScorecardPanel";

export const metadata: Metadata = {
  title: "Individual — Performance — Brusync OS",
};

export default async function PerformanceIndividualPage({
  searchParams,
}: {
  searchParams: Promise<{ ownerId?: string }>;
}) {
  const params = await searchParams;
  const data = await fetchPerformanceIndividualData(params.ownerId);

  return (
    <div>
      <div className="crm-card crm-card-pad" style={{ marginBottom: 20 }}>
        <div className="crm-field">
          <label htmlFor="owner-select">Vendedor</label>
          <OwnerFilterSelect owners={data.owners} selectedOwnerId={data.selectedOwnerId} />
        </div>
      </div>

      {data.scorecard ? (
        <ScorecardPanel scorecard={data.scorecard} />
      ) : (
        <div className="crm-card crm-card-pad">
          <p className="crm-card-sub">Nenhum vendedor disponível.</p>
        </div>
      )}
    </div>
  );
}
