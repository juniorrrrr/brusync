import type { Metadata } from "next";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { OriginPanel } from "@/components/dashboard/OriginPanel";
import { PerformancePanel } from "@/components/dashboard/PerformancePanel";
import { RevenuePanel } from "@/components/dashboard/RevenuePanel";
import {
  IconBuilding,
  IconChart,
  IconDoc,
  IconFunnel,
  IconPackage,
  IconTarget,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Dashboard — Brusync OS",
  robots: { index: false, follow: false },
};

const KPIS = [
  { label: "Leads Hoje", value: "18", delta: "12%", direction: "up" as const, icon: IconTarget },
  { label: "Leads no Mês", value: "342", delta: "8%", direction: "up" as const, icon: IconChart },
  { label: "Downloads", value: "587", delta: "15%", direction: "up" as const, icon: IconDoc },
  {
    label: "Conversão",
    value: "24.6%",
    delta: "3.2pp",
    direction: "up" as const,
    icon: IconFunnel,
  },
  {
    label: "Novos Clientes",
    value: "9",
    delta: "5%",
    direction: "up" as const,
    icon: IconBuilding,
  },
  {
    label: "Materiais Baixados",
    value: "214",
    delta: "11%",
    direction: "up" as const,
    icon: IconPackage,
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Dashboard</h1>
          <p className="crm-page-sub">Visão geral da operação Brusync</p>
        </div>
      </div>

      <div className="crm-kpi-grid">
        {KPIS.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="crm-row">
        <PerformancePanel />
        <OriginPanel />
      </div>

      <div className="crm-chart-wrap">
        <RevenuePanel />
      </div>
    </div>
  );
}
