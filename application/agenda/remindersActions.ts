"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoReminders } from "@/lib/demo/mockAgenda";
import {
  createReminder,
  deleteReminder,
  type ListRemindersOptions,
  listReminders,
  updateReminderStatus,
} from "@/repositories/agenda/remindersRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { AgendaReminder, ReminderStatus } from "@/types/agenda";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function fetchReminders(
  options: ListRemindersOptions = {},
): Promise<AgendaReminder[]> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoReminders(options);

  const supabase = await getSupabaseAuthClient();
  return listReminders(supabase, options);
}

export interface ReminderActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function createReminderAction(
  _prevState: ReminderActionState,
  formData: FormData,
): Promise<ReminderActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { status: "error", message: "Informe o texto do lembrete." };

  const remindAtRaw = String(formData.get("remindAt") ?? "");
  const remindAtDate = new Date(remindAtRaw);
  if (Number.isNaN(remindAtDate.getTime())) {
    return { status: "error", message: "Informe uma data e hora válidas." };
  }

  const crmLeadIdRaw = String(formData.get("crmLeadId") ?? "").trim();

  const supabase = await getSupabaseAuthClient();
  await createReminder(supabase, {
    crmLeadId: crmLeadIdRaw || null,
    agendaEventId: null,
    message,
    remindAt: remindAtDate.toISOString(),
    ownerId: profile.id,
    createdBy: profile.id,
  });

  revalidatePath("/agenda");
  return { status: "success", message: "Lembrete criado." };
}

export async function updateReminderStatusAction(
  id: string,
  status: ReminderStatus,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await updateReminderStatus(supabase, id, status);

  revalidatePath("/agenda");
  return { ok: true };
}

export async function deleteReminderAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await deleteReminder(supabase, id);

  revalidatePath("/agenda");
  return { ok: true };
}
