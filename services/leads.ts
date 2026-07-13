"use server";

import { getSupabaseServerClient } from "@/services/supabase/server";

export interface LeadFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitLead(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
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

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("leads").insert({
      name,
      email,
      company,
      phone: phone || null,
      message: message || null,
    });

    if (error) {
      console.error("submitLead: insert failed", error);
      return {
        status: "error",
        message: "Não foi possível enviar agora. Tente novamente em instantes.",
      };
    }

    return {
      status: "success",
      message: "Recebemos sua solicitação. Entraremos em contato em breve.",
    };
  } catch (err) {
    console.error("submitLead: unexpected error", err);
    return {
      status: "error",
      message: "Não foi possível enviar agora. Tente novamente em instantes.",
    };
  }
}
