import { formatRelativeToNow } from "@/domain/crm/format";
import type { RecentMaterialDownload } from "@/repositories/crm/marketingRepository";

export function RecentDownloadsPanel({ downloads }: { downloads: RecentMaterialDownload[] }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Últimos downloads</div>
          <div className="crm-card-sub">Materiais baixados no site</div>
        </div>
      </div>
      {downloads.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nenhum download registrado ainda.
        </p>
      ) : (
        <div className="crm-mini-list">
          {downloads.map((download) => (
            <div key={download.id} className="crm-mini-row">
              <span className="crm-mini-ico">📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="crm-mini-title">{download.materialTitle}</div>
                <div className="crm-mini-meta">
                  {download.name} · {download.email}
                </div>
              </div>
              <span className="crm-mini-trail">{formatRelativeToNow(download.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
