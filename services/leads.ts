"use server";

import { headers } from "next/headers";
import { antiBotConfig } from "@/config/antiBot.config";
import { buildAttributionInsertFields, parseTrackingContext } from "@/lib/tracking";
import { getSupabaseServerClient } from "@/services/supabase/server";

export interface LeadFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

const COOLDOWN_MESSAGE =
  "Você já enviou uma solicitação. Aguarde um instante antes de tentar de novo.";
const GENERIC_ERROR = "Não foi possível enviar agora. Tente novamente em instantes.";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClientIp(hdrs: Headers) {
  const forwardedFor = hdrs.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return hdrs.get("x-real-ip") ?? "unknown";
}

// DIAGNÓSTICO TEMPORÁRIO (remover após identificar a causa da regressão):
// loga tudo que o Supabase/PostgREST devolve, em vez de engolir o erro.
function logSupabaseIssue(label: string, payload: unknown) {
  console.error(
    `[submitLead:DIAG] ${label}`,
    JSON.stringify(payload, Object.getOwnPropertyNames((payload as object) ?? {}), 2),
  );
}

export async function submitLead(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  // Honeypot: campo invisível que humanos nunca preenchem.
  const honeypot = String(formData.get("website") ?? "").trim();
  if (honeypot !== "") {
    return { status: "error", message: GENERIC_ERROR };
  }

  // Validação de tempo: bloqueia envios automatizados extremamente rápidos.
  const renderedAt = Number(formData.get("rendered_at") ?? 0);
  if (!renderedAt || Date.now() - renderedAt < antiBotConfig.minFillTimeMs) {
    return { status: "error", message: GENERIC_ERROR };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !company) {
    return { status: "error", message: "Preencha nome, e-mail e empresa." };
  }
  if (!isValidEmail(email)) {
    return { status: "error", message: "Informe um e-mail válido." };
  }

  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  const context = parseTrackingContext(formData.get("tracking_context"));
  const { cooldownMs, perIpPerHour, perIpPerDay } = antiBotConfig.leadRateLimit;

  try {
    const supabase = getSupabaseServerClient();
    const now = Date.now();
    const cooldownAgo = new Date(now - cooldownMs).toISOString();
    const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    // Um mesmo identificador (IP, visitante, sessão ou e-mail) não pode
    // reenviar antes do fim do cooldown — espelha o bloqueio de 60s exibido
    // na interface, só que aplicado no servidor, onde não pode ser burlado.
    const identifierFilters: [string, string][] = [["ip_address", ip]];
    if (context?.visitorId) identifierFilters.push(["visitor_id", context.visitorId]);
    if (context?.sessionId) identifierFilters.push(["session_id", context.sessionId]);
    if (email) identifierFilters.push(["email", email]);

    for (const [column, value] of identifierFilters) {
      const { count, error, status, statusText } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq(column, value)
        .gte("created_at", cooldownAgo);
      if (error) {
        logSupabaseIssue(`cooldown check failed (column=${column})`, {
          error,
          status,
          statusText,
        });
      }
      if ((count ?? 0) > 0) {
        return { status: "error", message: COOLDOWN_MESSAGE };
      }
    }

    const {
      count: hourCount,
      error: hourError,
      status: hourStatus,
    } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", hourAgo);
    if (hourError) {
      logSupabaseIssue("hourly rate-limit check failed", { error: hourError, status: hourStatus });
    }
    if ((hourCount ?? 0) >= perIpPerHour) {
      return {
        status: "error",
        message: "Muitas solicitações recentes. Tente novamente em instantes.",
      };
    }

    const {
      count: dayCount,
      error: dayError,
      status: dayStatus,
    } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", dayAgo);
    if (dayError) {
      logSupabaseIssue("daily rate-limit check failed", { error: dayError, status: dayStatus });
    }
    if ((dayCount ?? 0) >= perIpPerDay) {
      return {
        status: "error",
        message: "Limite diário de solicitações atingido. Tente novamente amanhã.",
      };
    }

    const attribution = context
      ? buildAttributionInsertFields(context, { userAgent: hdrs.get("user-agent") })
      : {};

    const insertPayload = {
      name,
      email,
      company,
      phone: phone || null,
      message: message || null,
      ip_address: ip,
      ...attribution,
    };

    const { error, status, statusText } = await supabase.from("leads").insert(insertPayload);

    if (error) {
      logSupabaseIssue("insert failed", { error, status, statusText, payload: insertPayload });
      return { status: "error", message: GENERIC_ERROR };
    }

    return {
      status: "success",
      message: "Recebemos sua solicitação. Entraremos em contato em breve.",
    };
  } catch (err) {
    logSupabaseIssue("unexpected exception", {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      raw: err,
    });
    return { status: "error", message: GENERIC_ERROR };
  }
}
