import type { Metadata } from "next";
import Link from "next/link";
import { getMetaHealthData } from "@/application/metaConversionsApi/metaHealthQueries";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  IconBolt,
  IconCheckCircle,
  IconClock,
  IconReport,
  IconTarget,
} from "@/components/ui/icons";
import { formatDateTime, formatRelativeToNow } from "@/domain/crm/format";

export const metadata: Metadata = {
  title: "Meta Conversions API — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function MetaPanelPage() {
  const health = await getMetaHealthData();

  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Meta Conversions API</h1>
          <p className="crm-page-sub">
            Saúde da integração, qualidade dos dados e últimas falhas de envio
          </p>
        </div>
        <Link href="/integracoes/meta/logs" className="crm-ig-action-btn">
          Ver logs completos →
        </Link>
      </div>

      <div className="crm-kpi-grid">
        <KpiCard label="Eventos enviados" value={String(health.sentCount)} icon={IconCheckCircle} />
        <KpiCard label="Falhas" value={String(health.errorCount)} icon={IconBolt} />
        <KpiCard label="Pendentes" value={String(health.pendingCount)} icon={IconClock} />
        <KpiCard
          label="Taxa de sucesso"
          value={health.successRate !== null ? `${health.successRate.toFixed(1)}%` : "—"}
          icon={IconTarget}
        />
        <KpiCard
          label="Última sincronização"
          value={
            health.integration?.lastSync ? formatRelativeToNow(health.integration.lastSync) : "—"
          }
          icon={IconClock}
        />
        <KpiCard
          label="Health da integração"
          value={
            health.integration?.healthScore !== null &&
            health.integration?.healthScore !== undefined
              ? `${health.integration.healthScore}/100`
              : "—"
          }
          icon={IconReport}
        />
      </div>

      <div className="crm-card crm-card-pad" style={{ marginTop: 16 }}>
        <div className="crm-card-title">Qualidade dos dados enviados</div>
        <p className="crm-ig-desc" style={{ marginTop: 6 }}>
          {health.fieldCoveragePercent !== null
            ? `Em média, ${health.fieldCoveragePercent.toFixed(0)}% dos campos possíveis (external_id, e-mail, telefone, nome, cidade, fbclid, valor, moeda, URL, IP e User Agent) foram enviados nos últimos eventos com sucesso.`
            : "Ainda não há eventos enviados com sucesso para calcular a cobertura de campos."}
        </p>
        <p className="crm-card-sub" style={{ marginTop: 8 }}>
          Esta é uma estimativa própria do Brusync (campos enviados ÷ campos possíveis) — a Meta não
          devolve um "Event Match Quality" pela API; esse número oficial só existe dentro do Events
          Manager da própria Meta, calculado depois que ela processa os eventos.
        </p>
      </div>

      <div className="crm-card crm-card-pad" style={{ marginTop: 16 }}>
        <div className="crm-card-title" style={{ marginBottom: 8 }}>
          Falhas recentes
        </div>
        {health.recentFailures.length === 0 ? (
          <p className="crm-ig-desc">Nenhuma falha registrada.</p>
        ) : (
          health.recentFailures.map((failure) => (
            <div key={failure.id} className="crm-ig-log-row">
              <span className="crm-ig-log-dot error" />
              <div>
                <div>
                  <strong>{failure.leadName ?? "Lead removido"}</strong> —{" "}
                  {formatDateTime(failure.createdAt)}
                </div>
                {failure.message && (
                  <div className="crm-card-sub" style={{ color: "var(--danger)" }}>
                    {failure.message}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
