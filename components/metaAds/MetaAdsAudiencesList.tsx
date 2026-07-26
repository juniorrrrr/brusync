import { AUDIENCE_KIND_LABEL } from "@/domain/metaAds/statusMeta";
import type { MetaAudience } from "@/types/metaAds";

export function MetaAdsAudiencesList({ audiences }: { audiences: MetaAudience[] }) {
  if (audiences.length === 0) {
    return <p className="crm-card-sub">Nenhum público sincronizado ainda.</p>;
  }

  return (
    <div className="crm-table-wrap">
      <table className="crm-table">
        <thead>
          <tr>
            <th>Público</th>
            <th>Tipo</th>
            <th>Tamanho estimado</th>
            <th>Origem</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {audiences.map((audience) => (
            <tr key={audience.id}>
              <td className="cell-strong">{audience.name}</td>
              <td className="cell-muted">{AUDIENCE_KIND_LABEL[audience.kind]}</td>
              <td className="cell-muted">
                {audience.approximateCount !== null
                  ? audience.approximateCount.toLocaleString("pt-BR")
                  : "—"}
              </td>
              <td className="cell-muted">{audience.origin ?? "—"}</td>
              <td className="cell-muted">{audience.status ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
