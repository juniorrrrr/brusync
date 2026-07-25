import Link from "next/link";
import type { ComponentType } from "react";
import {
  IconAlertTriangle,
  IconArrowSwap,
  IconBolt,
  IconCalendar,
  IconChart,
  IconCheckCircle,
  IconClock,
  IconDoc,
  IconMessage,
  type IconProps,
  IconTarget,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";
import { operationsCardBadge } from "@/domain/operations/types";
import type { OperationsCard, OperationsCardKey } from "@/types/operations";

const CARD_ICON: Record<OperationsCardKey, ComponentType<IconProps>> = {
  leads_aguardando_contato: IconTarget,
  leads_atrasados: IconClock,
  followups_vencidos: IconClock,
  reunioes_hoje: IconCalendar,
  projetos_atrasados: IconDoc,
  projetos_proximos_prazo: IconDoc,
  clientes_aguardando_retorno: IconUsers,
  financeiro_vencendo_hoje: IconWallet,
  parcelas_atraso: IconWallet,
  conversoes_pendentes: IconCheckCircle,
  integracoes_erro: IconArrowSwap,
  automacoes_falhando: IconBolt,
  mensagens_nao_respondidas: IconMessage,
  alertas_criticos: IconAlertTriangle,
  insights_novos: IconChart,
};

export function OperationsCardsGrid({ cards }: { cards: OperationsCard[] }) {
  return (
    <div className="crm-ops-card-grid">
      {cards.map((card) => {
        const Icon = CARD_ICON[card.key];
        return (
          <Link key={card.key} href={card.href} className={`crm-ops-card ${card.severity}`}>
            <div className="crm-ops-card-top">
              <Icon size={16} />
              <span
                className={`crm-badge ${operationsCardBadge(card.severity)}`}
                style={{ fontSize: 9 }}
              >
                {card.severity === "critico"
                  ? "crítico"
                  : card.severity === "atencao"
                    ? "atenção"
                    : card.severity}
              </span>
            </div>
            <div className="crm-ops-card-value">{card.value}</div>
            <div className="crm-ops-card-label">{card.label}</div>
          </Link>
        );
      })}
    </div>
  );
}
