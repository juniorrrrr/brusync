"use server";

import { redirect } from "next/navigation";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

export async function signOut() {
  const supabase = await getSupabaseAuthClient();
  await supabase.auth.signOut();
  redirect("/login");
}
