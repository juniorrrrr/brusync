import type { Metadata } from "next";
import Link from "next/link";
import { getMetaLogsPageData } from "@/application/metaConversionsApi/metaLogsQueries";
import { MetaLogRow } from "@/components/integrations/MetaLogRow";
import { MetaLogsFilterBar } from "@/components/integrations/MetaLogsFilterBar";

export const metadata: Metadata = {
  title: "Logs Meta Conversions API — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function MetaLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const status =
    params.status === "sucesso" || params.status === "erro" ? params.status : undefined;

  const page = await getMetaLogsPageData({
    search: params.q || undefined,
    conversionType: params.type || undefined,
    status,
    createdFrom: params.from || undefined,
    createdTo: params.to || undefined,
    limit: 50,
  });

  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Logs — Meta Conversions API</h1>
          <p className="crm-page-sub">
            {page.total} {page.total === 1 ? "tentativa registrada" : "tentativas registradas"}
          </p>
        </div>
        <Link href="/integracoes/meta" className="crm-ig-action-btn">
          ← Voltar ao painel
        </Link>
      </div>

      <MetaLogsFilterBar />

      <div className="crm-card crm-card-pad" style={{ marginTop: 16 }}>
        {page.attempts.length === 0 ? (
          <p className="crm-ig-desc">Nenhum log encontrado para os filtros selecionados.</p>
        ) : (
          page.attempts.map((entry) => <MetaLogRow key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
