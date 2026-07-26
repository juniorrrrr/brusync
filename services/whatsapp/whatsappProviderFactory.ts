import "server-only";

import type { WhatsappProvider } from "@/domain/whatsapp/provider";
import { MetaCloudProvider } from "@/services/whatsapp/metaCloudProvider";

/** Fábrica única do provider de WhatsApp — hoje sempre devolve o
 * MetaCloudProvider (única implementação real desta fase, por decisão
 * explícita do escopo). Quando EvolutionProvider/TwilioProvider/
 * Dialog360Provider forem adicionados, cada um implementa `WhatsappProvider`
 * (domain/whatsapp/provider.ts) e este é o ÚNICO arquivo que muda para
 * ativá-lo — por conta corrente (whatsapp_accounts.provider), não por
 * variável global. */
let instance: WhatsappProvider | null = null;

export function getWhatsappProvider(_providerKey: "meta_cloud" = "meta_cloud"): WhatsappProvider {
  if (!instance) instance = new MetaCloudProvider();
  return instance;
}
