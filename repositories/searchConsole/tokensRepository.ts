import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const PROVIDER = "search_console";

interface TokenRow {
  id: string;
  google_account_email: string | null;
  access_token_ciphertext: string;
  access_token_iv: string;
  refresh_token_ciphertext: string | null;
  refresh_token_iv: string | null;
  expires_at: string | null;
}

export interface SaveSearchConsoleTokenPayload {
  googleAccountEmail: string | null;
  accessTokenCiphertext: string;
  accessTokenIv: string;
  refreshTokenCiphertext: string | null;
  refreshTokenIv: string | null;
  scopes: string[];
  expiresAt: string | null;
  createdBy: string | null;
}

export async function insertSearchConsoleToken(
  supabase: SupabaseClient,
  payload: SaveSearchConsoleTokenPayload,
): Promise<void> {
  const { error } = await supabase.from("google_oauth_tokens").insert({
    provider: PROVIDER,
    google_account_email: payload.googleAccountEmail,
    access_token_ciphertext: payload.accessTokenCiphertext,
    access_token_iv: payload.accessTokenIv,
    refresh_token_ciphertext: payload.refreshTokenCiphertext,
    refresh_token_iv: payload.refreshTokenIv,
    scopes: payload.scopes,
    expires_at: payload.expiresAt,
    created_by: payload.createdBy,
  });
  if (error) throw new Error(`Falha ao salvar token do Search Console: ${error.message}`);
}

export async function getCurrentSearchConsoleTokenSecret(
  supabase: SupabaseClient,
): Promise<TokenRow | null> {
  const { data, error } = await supabase
    .from("google_oauth_tokens")
    .select(
      "id, google_account_email, access_token_ciphertext, access_token_iv, refresh_token_ciphertext, refresh_token_iv, expires_at",
    )
    .eq("provider", PROVIDER)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar token do Search Console: ${error.message}`);
  return (data as TokenRow) ?? null;
}

export async function updateSearchConsoleAccessToken(
  supabase: SupabaseClient,
  tokenId: string,
  accessTokenCiphertext: string,
  accessTokenIv: string,
  expiresAt: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("google_oauth_tokens")
    .update({
      access_token_ciphertext: accessTokenCiphertext,
      access_token_iv: accessTokenIv,
      expires_at: expiresAt,
    })
    .eq("id", tokenId);
  if (error) throw new Error(`Falha ao atualizar token do Search Console: ${error.message}`);
}

export async function revokeSearchConsoleTokens(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase
    .from("google_oauth_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("provider", PROVIDER)
    .is("revoked_at", null);
  if (error) throw new Error(`Falha ao revogar tokens do Search Console: ${error.message}`);
}
