import "server-only";

import type { WhatsappProviderCredentials } from "@/domain/whatsapp/provider";
import { getDemoWhatsappAccount } from "@/lib/demo/mockWhatsapp";
import { updateIntegration } from "@/repositories/integrations/integrationsRepository";
import {
  getAccountSecrets,
  getActiveAccount,
  setAccountStatus,
  upsertAccount,
} from "@/repositories/whatsapp/accountsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { decryptToken, encryptToken } from "@/services/metaConversionsApi/tokenCrypto";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import { getWhatsappProvider } from "@/services/whatsapp/whatsappProviderFactory";
import type { WhatsappAccount } from "@/types/whatsapp";

/** Reaproveita a MESMA rotina de criptografia AES-256-GCM da Fase 9
 * (services/metaConversionsApi/tokenCrypto.ts) — nenhum esquema de
 * criptografia novo é criado para o WhatsApp. */

export async function getWhatsappAccount(): Promise<WhatsappAccount | null> {
  if (await isDemoModeActive()) return getDemoWhatsappAccount();
  const supabase = await getSupabaseAuthClient();
  return getActiveAccount(supabase);
}

export interface ConnectAccountInput {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  webhookVerifyToken: string;
  appSecret: string;
  createdBy: string | null;
}

/** Salva as credenciais (cifradas) e tenta validar imediatamente contra a
 * Graph API — se validar, marca a conta como conectada e espelha o status
 * na Central de Integrações (linha `provider = 'whatsapp'` já existente
 * desde a Fase 6/16, nunca uma segunda entrada no catálogo). */
export async function connectWhatsappAccount(input: ConnectAccountInput): Promise<WhatsappAccount> {
  const supabase = await getSupabaseAuthClient();

  const accessTokenEncrypted = encryptToken(input.accessToken);
  const verifyTokenEncrypted = encryptToken(input.webhookVerifyToken);
  const appSecretEncrypted = encryptToken(input.appSecret);

  const account = await upsertAccount(supabase, {
    phoneNumberId: input.phoneNumberId,
    wabaId: input.wabaId,
    accessTokenCiphertext: accessTokenEncrypted.ciphertext,
    accessTokenIv: accessTokenEncrypted.iv,
    webhookVerifyTokenCiphertext: verifyTokenEncrypted.ciphertext,
    webhookVerifyTokenIv: verifyTokenEncrypted.iv,
    appSecretCiphertext: appSecretEncrypted.ciphertext,
    appSecretIv: appSecretEncrypted.iv,
    createdBy: input.createdBy,
  });

  await testAndSyncAccountStatus(account.id);
  return account;
}

async function resolveCredentials(accountId: string): Promise<WhatsappProviderCredentials | null> {
  const supabase = await getSupabaseAuthClient();
  const secrets = await getAccountSecrets(supabase, accountId);
  if (!secrets?.access_token_ciphertext || !secrets.access_token_iv) return null;

  return {
    phoneNumberId: secrets.phone_number_id,
    wabaId: secrets.waba_id,
    accessToken: decryptToken(secrets.access_token_ciphertext, secrets.access_token_iv),
  };
}

export async function testAndSyncAccountStatus(accountId: string): Promise<WhatsappAccount | null> {
  const supabase = await getSupabaseAuthClient();
  const credentials = await resolveCredentials(accountId);
  if (!credentials) {
    await setAccountStatus(supabase, accountId, "erro", { error: "Credenciais incompletas." });
    return getActiveAccount(supabase);
  }

  const provider = getWhatsappProvider();
  const result = await provider.validateCredentials(credentials);

  if (result.ok) {
    await setAccountStatus(supabase, accountId, "conectado", {
      displayPhoneNumber: result.displayPhoneNumber,
      displayName: result.displayName,
      error: null,
    });
    await updateIntegration(supabase, "whatsapp", {
      status: "conectado",
      enabled: true,
      connectedAt: new Date().toISOString(),
      lastSync: new Date().toISOString(),
      error: null,
    });
  } else {
    await setAccountStatus(supabase, accountId, "erro", {
      error: result.error ?? "Falha ao validar.",
    });
    await updateIntegration(supabase, "whatsapp", { status: "erro", error: result.error ?? null });
  }

  return getActiveAccount(supabase);
}

export async function disconnectWhatsappAccount(accountId: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await setAccountStatus(supabase, accountId, "desconectado");
  await updateIntegration(supabase, "whatsapp", { status: "desconectado", enabled: false });
}

export async function getWhatsappCredentialsForAccount(
  accountId: string,
): Promise<WhatsappProviderCredentials | null> {
  return resolveCredentials(accountId);
}
