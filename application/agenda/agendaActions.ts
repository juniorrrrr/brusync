"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { AGENDA_EVENT_TYPES } from "@/domain/agenda/types";
import { getDemoAgendaEventById, getDemoAgendaEventsForLead } from "@/lib/demo/mockAgenda";
import {
  cancelAgendaEvent,
  completeAgendaEvent,
  createAgendaEvent,
  deleteAgendaEvent,
  getAgendaEventById,
  listAgendaEventsForLead,
  updateAgendaEvent,
} from "@/repositories/agenda/agendaEventsRepository";
import { recordAgendaTimelineEntry } from "@/services/agenda/agendaTimelineService";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { AgendaEvent, AgendaEventType } from "@/types/agenda";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function fetchAgendaEventById(id: string): Promise<AgendaEvent | null> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoAgendaEventById(id);

  const supabase = await getSupabaseAuthClient();
  return getAgendaEventById(supabase, id);
}

/** Client-callable wrapper for the Lead Workspace's Agenda tab — same
 * pattern as fetchConversionEventsForLead (Fase 8) and fetchMetaEventsForLead
 * (Fase 9): the query itself lives in a server-only file, this "use server"
 * action re-exposes it to a client component. */
export async function fetchAgendaEventsForLead(crmLeadId: string): Promise<AgendaEvent[]> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoAgendaEventsForLead(crmLeadId);

  const supabase = await getSupabaseAuthClient();
  return listAgendaEventsForLead(supabase, crmLeadId);
}

export interface AgendaEventActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function saveAgendaEventAction(
  _prevState: AgendaEventActionState,
  formData: FormData,
): Promise<AgendaEventActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { status: "error", message: "Informe um título para o evento." };

  const eventType = String(formData.get("eventType") ?? "outro") as AgendaEventType;
  if (!AGENDA_EVENT_TYPES.includes(eventType)) {
    return { status: "error", message: "Tipo de evento inválido." };
  }

  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "");
  const scheduledDate = new Date(scheduledAtRaw);
  if (Number.isNaN(scheduledDate.getTime())) {
    return { status: "error", message: "Informe uma data e hora válidas." };
  }

  const crmLeadIdRaw = String(formData.get("crmLeadId") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const durationRaw = String(formData.get("durationMinutes") ?? "").trim();
  const ownerIdRaw = String(formData.get("ownerId") ?? "").trim();

  const supabase = await getSupabaseAuthClient();

  if (id) {
    await updateAgendaEvent(supabase, id, {
      title,
      description: description || null,
      eventType,
      scheduledAt: scheduledDate.toISOString(),
      durationMinutes: durationRaw ? Number(durationRaw) : null,
      ownerId: ownerIdRaw || null,
    });
    const updated = await getAgendaEventById(supabase, id);
    if (updated) await recordAgendaTimelineEntry(supabase, updated, "agendada", profile.id);
  } else {
    const created = await createAgendaEvent(supabase, {
      crmLeadId: crmLeadIdRaw || null,
      title,
      description: description || null,
      eventType,
      scheduledAt: scheduledDate.toISOString(),
      durationMinutes: durationRaw ? Number(durationRaw) : null,
      ownerId: ownerIdRaw || null,
      createdBy: profile.id,
    });
    await recordAgendaTimelineEntry(supabase, created, "agendada", profile.id);
  }

  revalidatePath("/agenda");
  return { status: "success", message: id ? "Evento atualizado." : "Evento criado." };
}

export async function completeAgendaEventAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await completeAgendaEvent(supabase, id);
  const updated = await getAgendaEventById(supabase, id);
  if (updated) await recordAgendaTimelineEntry(supabase, updated, "concluida", profile.id);

  revalidatePath("/agenda");
  return { ok: true };
}

export async function cancelAgendaEventAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await cancelAgendaEvent(supabase, id);
  const updated = await getAgendaEventById(supabase, id);
  if (updated) await recordAgendaTimelineEntry(supabase, updated, "cancelada", profile.id);

  revalidatePath("/agenda");
  return { ok: true };
}

export async function deleteAgendaEventAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await deleteAgendaEvent(supabase, id);

  revalidatePath("/agenda");
  return { ok: true };
}
