import type { Metadata } from "next";
import { fetchProcessesPageData } from "@/application/processes/processesQueries";
import { ProcessesListClient } from "@/components/processes/ProcessesListClient";
import { ProcessFilterBar } from "@/components/processes/ProcessFilterBar";
import type { ProcessStatus } from "@/types/processes";

export const metadata: Metadata = {
  title: "Lista — Processos — Brusync OS",
};

export default async function ProcessesListPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    status?: string;
    ownerId?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await fetchProcessesPageData({
    search: params.search || undefined,
    categoryId: params.categoryId || undefined,
    status: (params.status as ProcessStatus) || undefined,
    ownerId: params.ownerId || undefined,
  });

  return (
    <div>
      <ProcessFilterBar filterOptions={data.filterOptions} />
      <div style={{ marginTop: 16 }}>
        <ProcessesListClient processes={data.processes} total={data.total} />
      </div>
    </div>
  );
}
