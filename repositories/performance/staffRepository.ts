import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { StaffMember } from "@/domain/performance/actualValue";
import { STAFF_ROLES } from "@/domain/performance/goalTypes";

interface StaffRow {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

/** Única query genuinamente nova desta fase além do CRUD de metas — não
 * existe em lugar nenhum do código uma listagem de staff COM o papel
 * (profiles.role), necessária para agrupar qualquer métrica por "equipe"
 * (que aqui significa "todos com o mesmo role", já que não existe tabela de
 * times). A policy "Equipe interna lê profiles da equipe", adicionada na
 * Fase 21, é o que torna esta leitura possível sob RLS. */
export async function listStaffWithRole(supabase: SupabaseClient): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .in("role", STAFF_ROLES);

  if (error) throw new Error(`Falha ao carregar equipe: ${error.message}`);
  return ((data ?? []) as StaffRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  }));
}
