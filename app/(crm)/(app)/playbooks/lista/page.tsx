import type { Metadata } from "next";
import { fetchPlaybooksPageData } from "@/application/playbooks/playbooksQueries";
import { PlaybookCard } from "@/components/playbooks/PlaybookCard";

export const metadata: Metadata = {
  title: "Lista — Playbooks — Brusync OS",
};

export default async function PlaybooksListPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const data = await fetchPlaybooksPageData({ search: params?.q });

  return (
    <div>
      <div className="crm-card-head">
        <div className="crm-card-title">Playbooks ({data.total})</div>
      </div>
      <div className="crm-int-grid" style={{ marginTop: 12 }}>
        {data.playbooks.map((playbook) => (
          <PlaybookCard key={playbook.id} playbook={playbook} />
        ))}
        {data.playbooks.length === 0 && (
          <p className="crm-card-sub">Nenhum playbook encontrado para os filtros atuais.</p>
        )}
      </div>
    </div>
  );
}
