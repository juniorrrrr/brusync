"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import type { MetaAdsActionState } from "@/application/metaAds/metaAdsAccountActions";
import { isDemoModeActive } from "@/services/demo/demoMode";
import {
  setAdAccountCrmLink,
  setCampaignProjectLink,
} from "@/services/metaAds/metaAdsCrmLinkService";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function setAdAccountCrmLinkAction(
  adAccountId: string,
  clientId: string | null,
  responsibleId: string | null,
): Promise<MetaAdsActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  await setAdAccountCrmLink(adAccountId, clientId, responsibleId);
  revalidatePath("/meta-ads");
  revalidatePath("/meta-ads/configuracoes");
  return { status: "success", message: "Vínculo atualizado." };
}

export async function setCampaignProjectLinkAction(
  campaignId: string,
  crmProjectId: string | null,
): Promise<MetaAdsActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  await setCampaignProjectLink(campaignId, crmProjectId);
  revalidatePath("/meta-ads/campanhas");
  return { status: "success", message: "Campanha vinculada ao projeto." };
}
