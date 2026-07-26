"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { isTokenEncryptionConfigured } from "@/services/metaConversionsApi/tokenCrypto";
import {
  connectWhatsappAccount,
  disconnectWhatsappAccount,
  testAndSyncAccountStatus,
} from "@/services/whatsapp/whatsappAccountService";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface WhatsappAccountActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

const INITIAL_STATE: WhatsappAccountActionState = { status: "idle" };

export { INITIAL_STATE as WHATSAPP_ACCOUNT_ACTION_INITIAL_STATE };

export async function connectWhatsappAccountAction(
  _prevState: WhatsappAccountActionState,
  formData: FormData,
): Promise<WhatsappAccountActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };
  if (!isTokenEncryptionConfigured()) {
    return {
      status: "error",
      message: "META_TOKEN_ENCRYPTION_KEY não configurada — defina antes de conectar a conta.",
    };
  }

  const phoneNumberId = String(formData.get("phoneNumberId") ?? "").trim();
  const wabaId = String(formData.get("wabaId") ?? "").trim();
  const accessToken = String(formData.get("accessToken") ?? "").trim();
  const webhookVerifyToken = String(formData.get("webhookVerifyToken") ?? "").trim();
  const appSecret = String(formData.get("appSecret") ?? "").trim();

  if (!phoneNumberId || !wabaId || !accessToken || !webhookVerifyToken || !appSecret) {
    return { status: "error", message: "Preencha todos os campos." };
  }

  try {
    const account = await connectWhatsappAccount({
      phoneNumberId,
      wabaId,
      accessToken,
      webhookVerifyToken,
      appSecret,
      createdBy: profile.id,
    });
    revalidatePath("/whatsapp");
    revalidatePath("/integracoes");
    return account.status === "conectado"
      ? { status: "success", message: "Conta conectada com sucesso." }
      : { status: "error", message: account.error ?? "Não foi possível validar as credenciais." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Falha ao conectar.",
    };
  }
}

export async function reauthWhatsappAccountAction(
  accountId: string,
): Promise<WhatsappAccountActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const account = await testAndSyncAccountStatus(accountId);
  revalidatePath("/whatsapp");
  revalidatePath("/integracoes");
  return account?.status === "conectado"
    ? { status: "success", message: "Credenciais validadas." }
    : { status: "error", message: account?.error ?? "Falha ao validar credenciais." };
}

export async function disconnectWhatsappAccountAction(
  accountId: string,
): Promise<WhatsappAccountActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  await disconnectWhatsappAccount(accountId);
  revalidatePath("/whatsapp");
  revalidatePath("/integracoes");
  return { status: "success", message: "Conta desconectada." };
}
