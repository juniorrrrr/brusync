import { type ActualValueDataset, computeActualValue } from "@/domain/performance/actualValue";
import type { TeamMemberMetrics } from "@/types/team";

/** Reaproveita 100% do computador de valor realizado da Fase 23
 * (domain/performance/actualValue.ts::computeActualValue) para "receita" e
 * "conversão" — a mesma lógica de quebra por dono (profiles.id) que já
 * alimenta o Individual de /performance serve tal qual aqui. Só a contagem de
 * clientes por responsável é genuinamente nova (não existe em nenhum tipo de
 * meta da Fase 23). */
export function computeMemberMetrics(
  profileId: string,
  dataset: ActualValueDataset,
  clientOwnerIds: (string | null)[],
): TeamMemberMetrics {
  const scope = { scopeType: "usuario" as const, scopeRef: profileId };

  const leadsCount = dataset.leads.filter((lead) => lead.ownerId === profileId).length;
  const projectsCount = dataset.projects.filter((project) => project.ownerId === profileId).length;
  const clientsCount = clientOwnerIds.filter((ownerId) => ownerId === profileId).length;
  const revenue = computeActualValue("receita", scope, dataset) ?? 0;
  const conversionRate = computeActualValue("conversao", scope, dataset);

  return { leadsCount, clientsCount, projectsCount, revenue, conversionRate };
}
