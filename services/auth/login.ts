"use server";

import { redirect } from "next/navigation";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

export interface LoginFormState {
  status: "idle" | "error";
  message?: string;
}

export async function signIn(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { status: "error", message: "Informe e-mail e senha." };
  }

  const supabase = await getSupabaseAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: "error", message: "E-mail ou senha inválidos." };
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}
