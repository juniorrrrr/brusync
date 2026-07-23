"use server";

import { redirect } from "next/navigation";
import { getCurrentPortalAccess } from "@/services/clientPortal/portalAccessService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

export interface PortalLoginFormState {
  status: "idle" | "error";
  message?: string;
}

/** Mirrors services/auth/login.ts's signIn exactly, but — unlike the
 * internal login, which trusts middleware/layout to sort out who's allowed
 * where — re-checks portal access right here and signs back out on failure.
 * Necessary because both apps share the same auth.users pool: without this,
 * a staff member's own valid password would "work" on this form too, land
 * them on a broken empty portal, and there'd be no clear error message. */
export async function portalSignInAction(
  _prevState: PortalLoginFormState,
  formData: FormData,
): Promise<PortalLoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { status: "error", message: "Informe e-mail e senha." };
  }

  const supabase = await getSupabaseAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: "error", message: "E-mail ou senha inválidos." };
  }

  const access = await getCurrentPortalAccess();
  if (!access) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "Este acesso não está habilitado para o Portal do Cliente.",
    };
  }

  redirect("/portal");
}

export async function portalSignOutAction(): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await supabase.auth.signOut();
  redirect("/portal/login");
}
