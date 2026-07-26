import "server-only";

import { getDemoMetaAdsAccount, getDemoMetaAdsSettingsPageData } from "@/lib/demo/mockMetaAds";
import {
  getActiveMetaAccount,
  setMetaAccountStatus,
} from "@/repositories/metaAds/accountsRepository";
import { listAdAccounts } from "@/repositories/metaAds/adAccountsRepository";
import { listBusinesses } from "@/repositories/metaAds/businessesRepository";
import { listRecentJobs } from "@/repositories/metaAds/syncJobsRepository";
import { getCurrentTokenSecret, revokeMetaTokens } from "@/repositories/metaAds/tokensRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { decryptToken } from "@/services/metaConversionsApi/tokenCrypto";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { MetaAccount, MetaAdsSettingsPageData } from "@/types/metaAds";

export async function getMetaAdsAccount(): Promise<MetaAccount | null> {
  if (await isDemoModeActive()) return getDemoMetaAdsAccount();
  const supabase = await getSupabaseAuthClient();
  return getActiveMetaAccount(supabase);
}

export async function getMetaAdsSettingsPageData(): Promise<MetaAdsSettingsPageData> {
  if (await isDemoModeActive()) return getDemoMetaAdsSettingsPageData();

  const supabase = await getSupabaseAuthClient();
  const account = await getActiveMetaAccount(supabase);
  if (!account) {
    return {
      account: null,
      businesses: [],
      adAccounts: [],
      recentJobs: [],
      oauthConfigured: Boolean(process.env.META_ADS_APP_ID && process.env.META_ADS_APP_SECRET),
    };
  }

  const [businesses, adAccounts, recentJobs] = await Promise.all([
    listBusinesses(supabase, account.id),
    listAdAccounts(supabase, account.id),
    listRecentJobs(supabase, account.id),
  ]);

  return {
    account,
    businesses,
    adAccounts,
    recentJobs,
    oauthConfigured: Boolean(process.env.META_ADS_APP_ID && process.env.META_ADS_APP_SECRET),
  };
}

/** Descriptografa e devolve o Access Token vigente da conta — chamado só
 * por services/metaAds/metaAdsSyncService.ts, nunca exposto a um Client
 * Component. */
export async function getDecryptedAccessToken(accountId: string): Promise<string | null> {
  const supabase = await getSupabaseAuthClient();
  const secret = await getCurrentTokenSecret(supabase, accountId);
  if (!secret) return null;
  return decryptToken(secret.access_token_ciphertext, secret.access_token_iv);
}

export async function disconnectMetaAdsAccount(accountId: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await revokeMetaTokens(supabase, accountId);
  await setMetaAccountStatus(supabase, accountId, "desconectado");
}
