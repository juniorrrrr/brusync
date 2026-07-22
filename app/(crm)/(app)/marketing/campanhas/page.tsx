import type { Metadata } from "next";
import {
  type CampaignSortKey,
  getCampaignRows,
} from "@/application/marketingAnalytics/campaignsQueries";
import { parseMarketingFilters } from "@/application/marketingAnalytics/filters";
import { LeadsPagination } from "@/components/crm/leads/LeadsPagination";
import { NoResults } from "@/components/crm/NoResults";
import { CampaignsTable } from "@/components/marketing/CampaignsTable";
import { IconReport } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Marketing · Campanhas — Brusync OS",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 15;

export default async function MarketingCampanhasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { filters } = parseMarketingFilters(params);
  const page = Math.max(1, Number(params.page) || 1);
  const sortBy = (params.sort as CampaignSortKey) || "leads";
  const sortDir = params.dir === "asc" ? "asc" : "desc";
  const search = params.q ?? "";

  const { rows, total } = await getCampaignRows({
    ...filters,
    search,
    sortBy,
    sortDir,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="crm-card">
      {total === 0 ? (
        <NoResults
          icon={IconReport}
          title="Nenhuma campanha encontrada"
          description="Ajuste os filtros ou aguarde novos leads com atribuição de campanha chegarem."
        />
      ) : (
        <>
          <CampaignsTable rows={rows} sortBy={sortBy} sortDir={sortDir} search={search} />
          <LeadsPagination page={page} limit={PAGE_SIZE} total={total} />
        </>
      )}
    </div>
  );
}
