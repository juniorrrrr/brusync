import { KpiCard } from "@/components/dashboard/KpiCard";
import { IconCheckCircle, IconMessage, IconStar, IconTarget } from "@/components/ui/icons";
import type { AiDashboardSummary as AiDashboardSummaryType } from "@/types/ai";

export function AiDashboardSummary({ summary }: { summary: AiDashboardSummaryType }) {
  return (
    <div className="crm-kpi-grid">
      <KpiCard label="Conversas" value={summary.totalConversations} icon={IconMessage} />
      <KpiCard label="Mensagens" value={summary.totalMessages} icon={IconMessage} />
      <KpiCard label="Sugestões geradas" value={summary.totalSuggestions} icon={IconTarget} />
      <KpiCard label="Favoritos" value={summary.totalFavorites} icon={IconStar} />
      <KpiCard label="Prompts salvos" value={summary.totalPrompts} icon={IconCheckCircle} />
      <KpiCard label="Uso (30 dias)" value={summary.usageLast30Days} icon={IconCheckCircle} />
    </div>
  );
}
