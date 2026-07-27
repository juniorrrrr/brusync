import "server-only";

import { listClients } from "@/repositories/crm/clientsRepository";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

/** Vínculo automático Conta/Propriedade/Container/Site ↔ Cliente do CRM
 * (Fase 35, "Relacionar automaticamente ... Cliente") — mesmo algoritmo de
 * substring que services/metaAds/metaAdsCrmLinkService.ts::
 * suggestClientForAdAccount (Fase 29) já usava, reaproveitando
 * repositories/crm/clientsRepository.ts sem duplicar nenhuma regra. Como
 * nenhum dos 4 providers do Google tem tela própria nesta fase para um
 * usuário confirmar a sugestão manualmente (diferente do Meta Ads, que tem
 * /meta-ads/configuracoes), o vínculo é aplicado direto quando há match —
 * silenciosamente ignorado quando não há nenhum, nunca bloqueia a seleção
 * da conta em si. */
export async function suggestClientIdForEntityName(
  entityName: string | null,
): Promise<string | null> {
  if (!entityName) return null;

  const supabase = await getSupabaseAuthClient();
  const clients = await listClients(supabase, {});
  const normalized = entityName.toLowerCase();
  const match = clients.find(
    (c) =>
      normalized.includes(c.company.toLowerCase()) || c.company.toLowerCase().includes(normalized),
  );
  return match?.id ?? null;
}
