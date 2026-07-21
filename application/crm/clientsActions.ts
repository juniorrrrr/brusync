"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { getClientDetailData } from "@/application/crm/clientsQueries";
import type { ActionState } from "@/application/crm/leadsActions";
import { getOwnerOptions } from "@/application/crm/leadsQueries";
import { createClient, updateClient } from "@/repositories/crm/clientsRepository";
import { createClientSchema, updateClientSchema } from "@/schemas/crm/client.schema";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

export async function fetchClientDetail(clientId: string) {
  await requireCrmProfile();
  const [client, owners] = await Promise.all([getClientDetailData(clientId), getOwnerOptions()]);
  return client ? { client, owners } : null;
}

export async function createClientAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireCrmProfile();

  const parsed = createClientSchema.safeParse({
    company: formData.get("company"),
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    ownerId: formData.get("ownerId") || undefined,
    status: formData.get("status") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: firstIssueMessage(parsed.error) };
  }

  const supabase = await getSupabaseAuthClient();
  await createClient(supabase, {
    company: parsed.data.company,
    name: parsed.data.name || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    ownerId: parsed.data.ownerId || null,
    status: parsed.data.status,
    createdBy: profile.id,
  });

  revalidatePath("/clientes");

  return { status: "success", message: "Cliente criado." };
}

export async function updateClientAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireCrmProfile();

  const parsed = updateClientSchema.safeParse({
    clientId: formData.get("clientId"),
    company: formData.get("company") || undefined,
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    ownerId: formData.get("ownerId") || undefined,
    status: formData.get("status") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: firstIssueMessage(parsed.error) };
  }

  const supabase = await getSupabaseAuthClient();
  const { clientId, ...patch } = parsed.data;
  await updateClient(supabase, clientId, patch);

  revalidatePath("/clientes");

  return { status: "success", message: "Cliente atualizado." };
}
