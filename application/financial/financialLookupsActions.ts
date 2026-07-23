"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoFinancialAccounts, getDemoFinancialCategories } from "@/lib/demo/mockFinancial";
import {
  createAccount as createAccountRepo,
  listAccounts,
} from "@/repositories/financial/accountsRepository";
import {
  createCategory as createCategoryRepo,
  listCategories,
} from "@/repositories/financial/categoriesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { FinancialAccountType, FinancialCategoryKind } from "@/types/financial";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function fetchFinancialAccounts() {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoFinancialAccounts();

  const supabase = await getSupabaseAuthClient();
  return listAccounts(supabase);
}

export async function fetchFinancialCategories() {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoFinancialCategories();

  const supabase = await getSupabaseAuthClient();
  return listCategories(supabase);
}

export interface LookupActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function createAccountAction(
  _prevState: LookupActionState,
  formData: FormData,
): Promise<LookupActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "banco") as FinancialAccountType;
  if (!name) return { status: "error", message: "Informe um nome para a conta." };

  const supabase = await getSupabaseAuthClient();
  await createAccountRepo(supabase, { name, type, createdBy: profile.id });
  return { status: "success" };
}

export async function createCategoryAction(
  _prevState: LookupActionState,
  formData: FormData,
): Promise<LookupActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "despesa") as FinancialCategoryKind;
  if (!name) return { status: "error", message: "Informe um nome para a categoria." };

  const supabase = await getSupabaseAuthClient();
  await createCategoryRepo(supabase, { name, kind });
  return { status: "success" };
}
