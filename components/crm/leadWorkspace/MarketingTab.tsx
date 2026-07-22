"use client";

import { useEffect, useState } from "react";
import { fetchLeadMarketingProfileAction } from "@/application/marketingAnalytics/leadMarketingProfileAction";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/domain/crm/format";
import { MARKETING_ORIGIN_LABEL } from "@/domain/marketing/originRules";
import type { LeadMarketingProfile } from "@/types/marketing";

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="crm-ws-row">
      <span className="crm-ws-row-label">{label}</span>
      <span className="crm-ws-row-value">{value}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="crm-ws-card">
      <div className="crm-ws-card-title" style={{ padding: "10px 0 2px" }}>
        {title}
      </div>
      <div className="crm-ws-card-body" style={{ paddingBottom: 8 }}>
        {children}
      </div>
    </div>
  );
}

export function MarketingTab({ crmLeadId }: { crmLeadId: string }) {
  const [profile, setProfile] = useState<LeadMarketingProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLeadMarketingProfileAction(crmLeadId).then((data) => {
      if (cancelled) return;
      setProfile(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [crmLeadId]);

  if (loading) {
    return (
      <div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="crm-ws-skeleton-row">
            <Skeleton style={{ width: "60%", height: 13, marginBottom: 6 }} />
            <Skeleton style={{ width: "40%", height: 11 }} />
          </div>
        ))}
      </div>
    );
  }

  if (!profile?.hasAttribution) {
    return (
      <Empty>
        <EmptyMedia variant="icon">📣</EmptyMedia>
        <EmptyTitle>Sem dados de marketing</EmptyTitle>
        <EmptyDescription>
          Este lead foi criado manualmente ou não tem atribuição de campanha registrada.
        </EmptyDescription>
      </Empty>
    );
  }

  const hasClickId = profile.gclid || profile.fbclid || profile.msclkid || profile.ttclid;

  return (
    <div>
      <Card title="Origem">
        <span className="crm-badge info">{MARKETING_ORIGIN_LABEL[profile.origin]}</span>
      </Card>

      <Card title="UTMs">
        <Row label="Source" value={profile.utmSource} />
        <Row label="Medium" value={profile.utmMedium} />
        <Row label="Campaign" value={profile.utmCampaign} />
        <Row label="Content" value={profile.utmContent} />
        <Row label="Term" value={profile.utmTerm} />
      </Card>

      <Card title="Navegação">
        <Row label="Landing page" value={profile.landingPage} />
        <Row label="Referer" value={profile.referer} />
        <Row
          label="Primeira visita"
          value={profile.firstVisit ? formatDateTime(profile.firstVisit) : null}
        />
        <Row
          label="Última visita"
          value={profile.lastVisit ? formatDateTime(profile.lastVisit) : null}
        />
      </Card>

      <Card title="Click IDs">
        {hasClickId ? (
          <>
            <Row label="GCLID" value={profile.gclid} />
            <Row label="FBCLID" value={profile.fbclid} />
            <Row label="MSCLKID" value={profile.msclkid} />
            <Row label="TTCLID" value={profile.ttclid} />
          </>
        ) : (
          <p className="crm-card-sub" style={{ margin: 0 }}>
            Nenhum click ID registrado.
          </p>
        )}
      </Card>

      <Card
        title={`Materiais baixados${profile.materialDownloads.length > 0 ? ` (${profile.materialDownloads.length})` : ""}`}
      >
        {profile.materialDownloads.length === 0 ? (
          <p className="crm-card-sub" style={{ margin: 0 }}>
            Nenhum material baixado por este e-mail.
          </p>
        ) : (
          <div className="crm-mini-list">
            {profile.materialDownloads.map((download) => (
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
      </Card>
    </div>
  );
}
