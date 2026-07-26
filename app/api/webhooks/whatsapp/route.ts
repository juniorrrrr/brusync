import { NextResponse } from "next/server";
import { getActiveAccount } from "@/repositories/whatsapp/accountsRepository";
import { getSupabaseServerClient } from "@/services/supabase/server";
import {
  getVerifyToken,
  processWebhookPayload,
  verifyWebhookSignature,
} from "@/services/whatsapp/whatsappWebhookService";

export const dynamic = "force-dynamic";

/** Endpoint público que a Meta chama diretamente — sem sessão do CRM, por
 * isso usa o client de service-role (mesmo padrão de
 * app/api/cron/meta-retry/route.ts). GET faz o handshake de verificação do
 * webhook (hub.challenge); POST recebe os eventos, valida a assinatura
 * HMAC (X-Hub-Signature-256) com o app secret cifrado da conta e delega
 * 100% do processamento para services/whatsapp/whatsappWebhookService.ts —
 * nenhuma regra de negócio fica nesta rota. */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const account = await getActiveAccount(supabase);
  if (!account) return NextResponse.json({ error: "no account configured" }, { status: 404 });

  const expectedToken = await getVerifyToken(supabase, account.id);
  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ error: "verification failed" }, { status: 403 });
  }

  return new NextResponse(challenge, { status: 200 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const supabase = getSupabaseServerClient();
  const account = await getActiveAccount(supabase);

  if (account) {
    const signature = request.headers.get("x-hub-signature-256");
    const valid = await verifyWebhookSignature(supabase, account.id, rawBody, signature);
    if (!valid) return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  await processWebhookPayload(supabase, payload);
  return NextResponse.json({ ok: true });
}
