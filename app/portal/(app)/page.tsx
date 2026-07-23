import type { Metadata } from "next";
import { getPortalDashboardPageData } from "@/application/clientPortal/portalDashboardQueries";
import { PortalTimelineList } from "@/components/clientPortal/PortalTimelineList";
import { PortalUpcomingDeliveries } from "@/components/clientPortal/PortalUpcomingDeliveries";
import { IconBell, IconCheckCircle, IconClock, IconTarget } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Portal do Cliente — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function PortalDashboardPage() {
  const { access, dashboard } = await getPortalDashboardPageData();

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>
        Olá, {access.clientCompany}
      </h1>
      <p className="crm-card-sub" style={{ marginTop: 4, marginBottom: 20 }}>
        Acompanhe aqui o andamento dos seus projetos com a Brusync.
      </p>

      <div className="crm-kpi-grid">
        <div className="crm-kpi">
          <div className="crm-kpi-top">
            <span className="crm-kpi-label">Projetos ativos</span>
            <span className="crm-kpi-ico">
              <IconClock size={16} />
            </span>
          </div>
          <div className="crm-kpi-val">{dashboard.activeProjects}</div>
        </div>
        <div className="crm-kpi">
          <div className="crm-kpi-top">
            <span className="crm-kpi-label">Projetos concluídos</span>
            <span className="crm-kpi-ico">
              <IconCheckCircle size={16} />
            </span>
          </div>
          <div className="crm-kpi-val">{dashboard.completedProjects}</div>
        </div>
        <div className="crm-kpi">
          <div className="crm-kpi-top">
            <span className="crm-kpi-label">Andamento geral</span>
            <span className="crm-kpi-ico">
              <IconTarget size={16} />
            </span>
          </div>
          <div className="crm-kpi-val">{dashboard.overallProgressPercent}%</div>
        </div>
        <div className="crm-kpi">
          <div className="crm-kpi-top">
            <span className="crm-kpi-label">Próximas entregas</span>
            <span className="crm-kpi-ico">
              <IconBell size={16} />
            </span>
          </div>
          <div className="crm-kpi-val">{dashboard.upcomingDeliveries.length}</div>
        </div>
      </div>

      <div className="crm-pt-dashboard-row">
        <div className="crm-ws-card">
          <div className="crm-ws-card-title">Últimas movimentações</div>
          <PortalTimelineList entries={dashboard.recentActivity} showProjectName />
        </div>
        <div className="crm-ws-card">
          <div className="crm-ws-card-title">Próximas entregas</div>
          <PortalUpcomingDeliveries items={dashboard.upcomingDeliveries} />
        </div>
      </div>
    </div>
  );
}
