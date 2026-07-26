"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { disconnectMetaAdsAccount } from "@/services/metaAds/metaAdsAccountService";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface MetaAdsActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

const INITIAL_STATE: MetaAdsActionState = { status: "idle" };

export { INITIAL_STATE as META_ADS_ACTION_INITIAL_STATE };

export async function disconnectMetaAdsAccountAction(
  accountId: string,
): Promise<MetaAdsActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  await disconnectMetaAdsAccount(accountId);
  revalidatePath("/meta-ads");
  revalidatePath("/integracoes");
  return { status: "success", message: "Conta desconectada." };
}
