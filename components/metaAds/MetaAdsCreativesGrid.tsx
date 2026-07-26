import { CREATIVE_KIND_LABEL } from "@/domain/metaAds/statusMeta";
import type { MetaCreative } from "@/types/metaAds";

function CreativeCard({ creative }: { creative: MetaCreative }) {
  const disapproved = creative.status === "DISAPPROVED";

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 10",
          borderRadius: 8,
          background: "var(--surface-2, #f1f3f5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        {creative.thumbnailUrl || creative.imageUrl ? (
          // biome-ignore lint/performance/noImgElement: preview vem direto da CDN da Meta, sem otimização própria necessária
          <img
            src={creative.thumbnailUrl ?? creative.imageUrl ?? ""}
            alt={creative.headline ?? creative.name ?? "Criativo"}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span className="crm-card-sub">{CREATIVE_KIND_LABEL[creative.kind]}</span>
        )}
      </div>

      <div className="crm-int-card-top">
        <div>
          <div className="crm-int-card-title">
            {creative.headline ?? creative.name ?? "Sem título"}
          </div>
          <div className="crm-int-card-desc">{CREATIVE_KIND_LABEL[creative.kind]}</div>
        </div>
        {disapproved && <span className="crm-badge danger">Reprovado</span>}
      </div>

      {creative.body && (
        <p className="crm-card-sub" style={{ marginTop: 6 }}>
          {creative.body}
        </p>
      )}

      {creative.callToAction && (
        <span className="crm-badge neutral" style={{ marginTop: 8, display: "inline-block" }}>
          {creative.callToAction}
        </span>
      )}
    </div>
  );
}

export function MetaAdsCreativesGrid({ creatives }: { creatives: MetaCreative[] }) {
  if (creatives.length === 0) {
    return <p className="crm-card-sub">Nenhum criativo sincronizado ainda.</p>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 16,
      }}
    >
      {creatives.map((creative) => (
        <CreativeCard key={creative.id} creative={creative} />
      ))}
    </div>
  );
}
