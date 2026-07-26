import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

interface TokenSecretRow {
  id: string;
  access_token_ciphertext: string;
  access_token_iv: string;
  expires_at: string | null;
}

export interface SaveTokenPayload {
  accountId: string;
  accessTokenCiphertext: string;
  accessTokenIv: string;
  tokenType: "short_lived" | "long_lived" | "system_user";
  scopes: string[];
  expiresAt: string | null;
}

/** Renovar insere uma nova linha (nunca sobrescreve) — histórico de
 * renovação para auditoria, mesmo padrão de log-first já usado em
 * crm_playbook_history/crm_process_history. */
export async function insertMetaToken(
  supabase: SupabaseClient,
  payload: SaveTokenPayload,
): Promise<void> {
  const { error } = await supabase.from("meta_tokens").insert({
    account_id: payload.accountId,
    access_token_ciphertext: payload.accessTokenCiphertext,
    access_token_iv: payload.accessTokenIv,
    token_type: payload.tokenType,
    scopes: payload.scopes,
    expires_at: payload.expiresAt,
  });

  if (error) throw new Error(`Falha ao salvar token do Meta Ads: ${error.message}`);
}

export async function getCurrentTokenSecret(
  supabase: SupabaseClient,
  accountId: string,
): Promise<TokenSecretRow | null> {
  const { data, error } = await supabase
    .from("meta_tokens")
    .select("id, access_token_ciphertext, access_token_iv, expires_at")
    .eq("account_id", accountId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar token do Meta Ads: ${error.message}`);
  return (data as TokenSecretRow) ?? null;
}

export async function revokeMetaTokens(supabase: SupabaseClient, accountId: string): Promise<void> {
  const { error } = await supabase
    .from("meta_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("account_id", accountId)
    .is("revoked_at", null);

  if (error) throw new Error(`Falha ao revogar tokens do Meta Ads: ${error.message}`);
}
