import type { Metadata } from "next";
import { getClientsPageData } from "@/application/crm/clientsQueries";
import { ClientsTable } from "@/components/crm/clients/ClientsTable";
import { ClientsToolbar } from "@/components/crm/clients/ClientsToolbar";
import { CreateClientDialog } from "@/components/crm/clients/CreateClientDialog";
import { NoResults } from "@/components/crm/NoResults";
import { IconBuilding } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Clientes — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { clients, owners } = await getClientsPageData({ search: params.q });

  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Clientes</h1>
          <p className="crm-page-sub">
            {clients.length} cliente{clients.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="crm-page-actions">
          <CreateClientDialog owners={owners} />
        </div>
      </div>

      <ClientsToolbar initialSearch={params.q ?? ""} />

      <div className="crm-card">
        {clients.length === 0 ? (
          <NoResults
            icon={IconBuilding}
            title="Nenhum cliente encontrado"
            description="Ajuste a busca ou crie um novo cliente."
          />
        ) : (
          <ClientsTable clients={clients} />
        )}
      </div>
    </div>
  );
}
