import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  IconAlertTriangle,
  IconCheckCircle,
  IconClock,
  IconMessage,
  IconSend,
} from "@/components/ui/icons";
import { ACCOUNT_STATUS_BADGE, ACCOUNT_STATUS_LABEL } from "@/domain/whatsapp/statusMeta";
import type { WhatsappDashboardData } from "@/types/whatsapp";

export function WhatsappDashboardSummary({ data }: { data: WhatsappDashboardData }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        className="crm-card crm-card-pad"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <div>
          <div className="crm-card-title">Status da API</div>
          <p className="crm-card-sub">
            {data.account?.displayPhoneNumber ?? "Nenhuma conta conectada"}
            {data.account?.displayName ? ` · ${data.account.displayName}` : ""}
          </p>
        </div>
        <span
          className={`crm-badge ${data.account ? ACCOUNT_STATUS_BADGE[data.account.status] : "neutral"}`}
        >
          {data.account ? ACCOUNT_STATUS_LABEL[data.account.status] : "Não configurado"}
        </span>
      </div>

      <div className="crm-kpi-grid">
        <KpiCard label="Mensagens enviadas" value={data.messagesSent} icon={IconSend} />
        <KpiCard label="Mensagens recebidas" value={data.messagesReceived} icon={IconMessage} />
        <KpiCard
          label="Tempo médio de resposta"
          value={
            data.averageResponseMinutes !== null
              ? `${data.averageResponseMinutes.toFixed(0)} min`
              : "—"
          }
          icon={IconClock}
        />
        <KpiCard label="Conversas abertas" value={data.openConversations} icon={IconMessage} />
        <KpiCard
          label="Conversas encerradas"
          value={data.closedConversations}
          icon={IconCheckCircle}
        />
        <KpiCard label="Templates enviados" value={data.templatesSent} icon={IconSend} />
        <KpiCard label="Falhas" value={data.failures} icon={IconAlertTriangle} />
      </div>
    </div>
  );
}
