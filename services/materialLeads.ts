"use server";

import { headers } from "next/headers";
import { antiBotConfig } from "@/config/antiBot.config";
import { getMaterial } from "@/data/materials";
import { buildAttributionInsertFields, parseTrackingContext } from "@/lib/tracking";
import { publishEvent } from "@/services/eventBus/eventBus";
import { getSupabaseServerClient } from "@/services/supabase/server";
import { verifyTurnstileToken } from "@/services/turnstile";

export interface MaterialLeadFormState {
  status: "idle" | "success" | "error" | "rejected";
  message?: string;
  downloadUrl?: string;
  fileName?: string;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hasFullName(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).length >= 2;
}

function isValidBrPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

function isDisposableEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  return domain
    ? (antiBotConfig.disposableEmailDomains as readonly string[]).includes(domain)
    : false;
}

function getClientIp(hdrs: Headers) {
  const forwardedFor = hdrs.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return hdrs.get("x-real-ip") ?? "unknown";
}

const GENERIC_REJECTION = {
  status: "rejected" as const,
  message: "Não foi possível processar sua solicitação.",
};

export async function submitMaterialLead(
  _prevState: MaterialLeadFormState,
  formData: FormData,
): Promise<MaterialLeadFormState> {
  // Honeypot: campo invisível que humanos nunca preenchem.
  const honeypot = String(formData.get("company_site") ?? "").trim();
  if (honeypot !== "") {
    return GENERIC_REJECTION;
  }

  // Validação de tempo: bloqueia envios automatizados extremamente rápidos.
  const renderedAt = Number(formData.get("rendered_at") ?? 0);
  if (!renderedAt || Date.now() - renderedAt < antiBotConfig.minFillTimeMs) {
    return GENERIC_REJECTION;
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const materialSlug = String(formData.get("materialSlug") ?? "").trim();
  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");

  const material = getMaterial(materialSlug);
  if (!material) {
    return { status: "error", message: "Material não encontrado." };
  }
  if (!hasFullName(name)) {
    return { status: "error", message: "Informe seu nome completo." };
  }
  if (!isValidEmail(email)) {
    return { status: "error", message: "Informe um e-mail válido." };
  }
  if (isDisposableEmail(email)) {
    return { status: "error", message: "Use um e-mail válido para receber o material." };
  }
  if (!isValidBrPhone(phone)) {
    return { status: "error", message: "Informe um telefone válido, com DDD." };
  }

  const hdrs = await headers();
  const ip = getClientIp(hdrs);

  const turnstileOk = await verifyTurnstileToken(turnstileToken, ip);
  if (!turnstileOk) {
    return GENERIC_REJECTION;
  }

  try {
    const supabase = getSupabaseServerClient();
    const now = Date.now();
    const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const { count: hourCount } = await supabase
      .from("material_leads")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", hourAgo);
    if ((hourCount ?? 0) >= antiBotConfig.rateLimit.perIpPerHour) {
      return {
        status: "rejected",
        message: "Muitas solicitações recentes. Tente novamente em instantes.",
      };
    }

    const { count: dayCount } = await supabase
      .from("material_leads")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", dayAgo);
    if ((dayCount ?? 0) >= antiBotConfig.rateLimit.perIpPerDay) {
      return {
        status: "rejected",
        message: "Limite diário de downloads atingido. Tente novamente amanhã.",
      };
    }

    const { count: emailCount } = await supabase
      .from("material_leads")
      .select("*", { count: "exact", head: true })
      .eq("email", email);

    const context = parseTrackingContext(formData.get("tracking_context"));
    const attribution = context
      ? buildAttributionInsertFields(context, { userAgent: hdrs.get("user-agent") })
      : {};

    const { error } = await supabase.from("material_leads").insert({
      name,
      email,
      phone,
      material_slug: material.slug,
      material_title: material.title,
      source: String(formData.get("source") ?? "materiais"),
      download_count: (emailCount ?? 0) + 1,
      ip_address: ip,
      turnstile_verified: Boolean(process.env.TURNSTILE_SECRET_KEY),
      ...attribution,
    });

    if (error) {
      console.error("submitMaterialLead: insert failed", error);
      return { status: "error", message: "Não foi possível processar seu pedido agora." };
    }

    await publishEvent(supabase, "DownloadMaterial", {
      email,
      materialSlug: material.slug,
      materialTitle: material.title,
    });

    return {
      status: "success",
      message: "Tudo certo! Seu download será iniciado automaticamente.",
      downloadUrl: `/materiais/${material.fileName}`,
      fileName: material.fileName,
    };
  } catch (err) {
    console.error("submitMaterialLead: unexpected error", err);
    return { status: "error", message: "Não foi possível processar seu pedido agora." };
  }
}
