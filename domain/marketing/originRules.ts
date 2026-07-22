import type { MarketingOrigin } from "@/types/marketing";

export const MARKETING_ORIGIN_LABEL: Record<MarketingOrigin, string> = {
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  organico: "Orgânico",
  direto: "Direto",
  indicacao: "Indicação",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  outros: "Outros",
};

export const MARKETING_ORIGINS: MarketingOrigin[] = [
  "google_ads",
  "meta_ads",
  "organico",
  "direto",
  "indicacao",
  "linkedin",
  "tiktok",
  "outros",
];

export interface OriginClassificationInput {
  utmSource: string | null;
  utmMedium: string | null;
  referer: string | null;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  ttclid: string | null;
  /** crm_leads.origin — free-text field set when a lead is created manually
   * (no source_lead_id, so no UTM attribution exists at all). Used only as a
   * fallback so every lead lands in some bucket instead of always "Outros". */
  manualOrigin: string | null;
}

/** Classifies a lead into one of the 8 canonical Marketing Intelligence
 * origin buckets. There is no real ad-platform integration yet (see Fase 5
 * notes) — this is a best-effort heuristic over utm_source/utm_medium/click
 * IDs, the only attribution signals the site actually captures today. */
export function classifyMarketingOrigin(input: OriginClassificationInput): MarketingOrigin {
  const source = input.utmSource?.toLowerCase().trim() ?? "";
  const medium = input.utmMedium?.toLowerCase().trim() ?? "";

  if (input.gclid || source.includes("google")) return "google_ads";
  if (
    input.fbclid ||
    source.includes("facebook") ||
    source.includes("instagram") ||
    source.includes("meta") ||
    source === "fb" ||
    source === "ig"
  ) {
    return "meta_ads";
  }
  if (input.ttclid || source.includes("tiktok")) return "tiktok";
  if (source.includes("linkedin")) return "linkedin";
  if (medium === "referral" || source.includes("indicac")) return "indicacao";
  if (medium === "organic" || medium === "seo") return "organico";
  if (!source && !input.referer && !input.msclkid) return "direto";

  const manual = input.manualOrigin?.toLowerCase().trim() ?? "";
  if (manual) {
    if (manual.includes("google")) return "google_ads";
    if (manual.includes("meta") || manual.includes("facebook") || manual.includes("instagram")) {
      return "meta_ads";
    }
    if (manual.includes("linkedin")) return "linkedin";
    if (manual.includes("tiktok")) return "tiktok";
    if (manual.includes("indicac")) return "indicacao";
    if (manual.includes("organic") || manual.includes("orgânic")) return "organico";
    if (manual.includes("direto")) return "direto";
  }

  return "outros";
}
