const UNSET = "(não informado)";

export interface CampaignKeyParts {
  utmSource: string | null;
  utmCampaign: string | null;
}

/** Campaign identity = (utm_source, utm_campaign) pair — the same campaign
 * name reused across two platforms is treated as two distinct campaigns. */
export function buildCampaignKey({ utmSource, utmCampaign }: CampaignKeyParts): string {
  const source = utmSource?.trim() || UNSET;
  const campaign = utmCampaign?.trim() || UNSET;
  return `${source}::${campaign}`;
}

export function parseCampaignKey(key: string): CampaignKeyParts {
  const [source, campaign] = key.split("::");
  return {
    utmSource: source === UNSET ? null : (source ?? null),
    utmCampaign: campaign === UNSET ? null : (campaign ?? null),
  };
}

export function campaignDisplayName({ utmSource, utmCampaign }: CampaignKeyParts): string {
  if (!utmCampaign && !utmSource) return "Sem campanha";
  return `${utmCampaign || UNSET} · ${utmSource || UNSET}`;
}
