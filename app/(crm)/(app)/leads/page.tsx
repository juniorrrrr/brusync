import type { Metadata } from "next";
import { getLeadsPageData } from "@/application/crm/leadsQueries";
import { CreateLeadDialog } from "@/components/crm/leads/CreateLeadDialog";
import { LeadsPagination } from "@/components/crm/leads/LeadsPagination";
import { LeadsTable } from "@/components/crm/leads/LeadsTable";
import { LeadsToolbar } from "@/components/crm/leads/LeadsToolbar";
import { NoResults } from "@/components/crm/NoResults";
import { IconTarget } from "@/components/ui/icons";
import type { ListLeadsOptions } from "@/repositories/crm/leadsRepository";

export const metadata: Metadata = {
  title: "Leads — Brusync OS",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 25;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const sortBy = (params.sort as ListLeadsOptions["sortBy"]) || "created_at";
  const sortDir = params.dir === "asc" ? "asc" : "desc";

  const { leads, total, stages, owners } = await getLeadsPageData({
    search: params.q,
    stageId: params.stage,
    ownerId: params.owner,
    city: params.city,
    tag: params.tag,
    status: params.status as ListLeadsOptions["status"],
    scoreMin: params.scoreMin ? Number(params.scoreMin) : undefined,
    scoreMax: params.scoreMax ? Number(params.scoreMax) : undefined,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    sortBy,
    sortDir,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Leads</h1>
          <p className="crm-page-sub">
            {total} lead{total === 1 ? "" : "s"} no funil comercial
          </p>
        </div>
        <div className="crm-page-actions">
          <CreateLeadDialog owners={owners} />
        </div>
      </div>

      <LeadsToolbar
        stages={stages}
        owners={owners}
        initialSearch={params.q ?? ""}
        initialStageId={params.stage ?? ""}
        initialOwnerId={params.owner ?? ""}
        initialCity={params.city ?? ""}
        initialStatus={params.status ?? ""}
        initialTag={params.tag ?? ""}
        initialScoreMin={params.scoreMin ?? ""}
        initialScoreMax={params.scoreMax ?? ""}
        initialCreatedFrom={params.createdFrom ?? ""}
        initialCreatedTo={params.createdTo ?? ""}
      />

      <div className="crm-card">
        {leads.length === 0 ? (
          <NoResults
            icon={IconTarget}
            title="Nenhum lead encontrado"
            description="Ajuste os filtros ou crie um novo lead para começar a trabalhar o funil."
          />
        ) : (
          <>
            <LeadsTable
              leads={leads}
              stages={stages}
              owners={owners}
              sortBy={sortBy}
              sortDir={sortDir}
            />
            <LeadsPagination page={page} limit={PAGE_SIZE} total={total} />
          </>
        )}
      </div>
    </div>
  );
}
