import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDateTime } from "@/domain/crm/format";
import type { CrmLeadWithRelations, MaterialDownload, SourceLeadAttribution } from "@/types/crm";

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="crm-ws-row">
      <span className="crm-ws-row-label">{label}</span>
      <span className="crm-ws-row-value">{value}</span>
    </div>
  );
}

export function WorkspaceSidebar({
  lead,
  sourceAttribution,
  materialDownloads,
}: {
  lead: CrmLeadWithRelations;
  sourceAttribution: SourceLeadAttribution | null;
  materialDownloads: MaterialDownload[];
}) {
  return (
    <Accordion type="multiple" defaultValue={["info", "marketing", "downloads"]}>
      <AccordionItem value="info" className="crm-ws-card">
        <AccordionTrigger className="crm-ws-card-title">Informações</AccordionTrigger>
        <AccordionContent>
          <div className="crm-ws-card-body">
            <Row label="Nome" value={lead.name} />
            <Row label="Telefone" value={lead.phone} />
            <Row label="E-mail" value={lead.email} />
            <Row label="Empresa" value={lead.company} />
            <Row label="Cargo" value={lead.jobTitle} />
            <Row label="Cidade" value={lead.city} />
            <Row label="Origem" value={lead.origin} />
            <Row label="Landing page" value={sourceAttribution?.landingPage} />
            <Row
              label="Primeira visita"
              value={
                sourceAttribution?.firstVisit ? formatDateTime(sourceAttribution.firstVisit) : null
              }
            />
            <Row
              label="Última visita"
              value={
                sourceAttribution?.lastVisit ? formatDateTime(sourceAttribution.lastVisit) : null
              }
            />
            <Row label="Dispositivo" value={sourceAttribution?.device} />
            <Row label="Navegador" value={sourceAttribution?.browser} />
            <Row label="Sistema" value={sourceAttribution?.os} />
            <Row label="Idioma" value={sourceAttribution?.language} />
            {!sourceAttribution && !lead.jobTitle && !lead.city && (
              <p className="crm-card-sub" style={{ margin: 0 }}>
                Lead criado manualmente — sem dados de tracking.
              </p>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="marketing" className="crm-ws-card">
        <AccordionTrigger className="crm-ws-card-title">Marketing</AccordionTrigger>
        <AccordionContent>
          <div className="crm-ws-card-body">
            {sourceAttribution ? (
              <>
                <Row label="UTM Source" value={sourceAttribution.utmSource} />
                <Row label="UTM Medium" value={sourceAttribution.utmMedium} />
                <Row label="UTM Campaign" value={sourceAttribution.utmCampaign} />
                <Row label="UTM Content" value={sourceAttribution.utmContent} />
                <Row label="UTM Term" value={sourceAttribution.utmTerm} />
                <Row label="GCLID" value={sourceAttribution.gclid} />
                <Row label="FBCLID" value={sourceAttribution.fbclid} />
                <Row label="MSCLKID" value={sourceAttribution.msclkid} />
                <Row label="TTCLID" value={sourceAttribution.ttclid} />
                <Row label="Referer" value={sourceAttribution.referer} />
                <Row label="Landing page" value={sourceAttribution.landingPage} />
              </>
            ) : (
              <p className="crm-card-sub" style={{ margin: 0 }}>
                Sem dados de campanha para este lead.
              </p>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="downloads" className="crm-ws-card">
        <AccordionTrigger className="crm-ws-card-title">
          Downloads {materialDownloads.length > 0 && `(${materialDownloads.length})`}
        </AccordionTrigger>
        <AccordionContent>
          {materialDownloads.length === 0 ? (
            <p className="crm-card-sub" style={{ margin: 0 }}>
              Nenhum material baixado por este e-mail.
            </p>
          ) : (
            <div className="crm-mini-list">
              {materialDownloads.map((download) => (
                <div key={download.id} className="crm-mini-row">
                  <span className="crm-mini-ico">📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="crm-mini-title">{download.materialTitle}</div>
                    <div className="crm-mini-meta">{formatDateTime(download.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
