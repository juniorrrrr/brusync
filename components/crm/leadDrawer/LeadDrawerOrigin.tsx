import { formatDateTime } from "@/domain/crm/format";
import type { MaterialDownload, SourceLeadAttribution } from "@/types/crm";

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="crm-info-row">
      <span className="crm-info-row-label">{label}</span>
      <span className="crm-info-row-value">{value}</span>
    </div>
  );
}

export function LeadDrawerOrigin({
  sourceAttribution,
  materialDownloads,
}: {
  sourceAttribution: SourceLeadAttribution | null;
  materialDownloads: MaterialDownload[];
}) {
  return (
    <>
      <div
        className="crm-drawer-section"
        style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}
      >
        <div className="crm-drawer-section-title">UTMs e atribuição</div>
        {sourceAttribution ? (
          <div className="crm-info-list">
            <Row label="Enviado em" value={formatDateTime(sourceAttribution.createdAt)} />
            <Row label="UTM Source" value={sourceAttribution.utmSource} />
            <Row label="UTM Medium" value={sourceAttribution.utmMedium} />
            <Row label="UTM Campaign" value={sourceAttribution.utmCampaign} />
            <Row label="UTM Term" value={sourceAttribution.utmTerm} />
            <Row label="UTM Content" value={sourceAttribution.utmContent} />
            <Row label="Google Click ID" value={sourceAttribution.gclid} />
            <Row label="Facebook Click ID" value={sourceAttribution.fbclid} />
            <Row label="Landing page" value={sourceAttribution.landingPage} />
            <Row label="Referer" value={sourceAttribution.referer} />
            <Row label="Dispositivo" value={sourceAttribution.device} />
            <Row label="Sistema" value={sourceAttribution.os} />
            <Row label="Navegador" value={sourceAttribution.browser} />
          </div>
        ) : (
          <p className="crm-card-sub">Lead criado manualmente — sem dados de tracking.</p>
        )}
        {sourceAttribution?.message && (
          <div style={{ marginTop: 14 }}>
            <div className="crm-drawer-section-title">Mensagem do formulário</div>
            <p className="crm-card-sub" style={{ marginTop: 0 }}>
              {sourceAttribution.message}
            </p>
          </div>
        )}
      </div>

      <div className="crm-drawer-section">
        <div className="crm-drawer-section-title">Materiais baixados</div>
        {materialDownloads.length === 0 ? (
          <p className="crm-card-sub">Nenhum material baixado por este e-mail.</p>
        ) : (
          <div className="crm-mini-list">
            {materialDownloads.map((download) => (
              <div key={download.id} className="crm-mini-row">
                <div className="crm-mini-ico">📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="crm-mini-title">{download.materialTitle}</div>
                  <div className="crm-mini-meta">{formatDateTime(download.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
