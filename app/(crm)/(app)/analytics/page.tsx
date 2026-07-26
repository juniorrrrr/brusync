import type { Metadata } from "next";
import { fetchDashboardsPageData } from "@/application/analytics/analyticsQueries";
import { AnalyticsCreateDashboardForm } from "@/components/analytics/AnalyticsCreateDashboardForm";
import { AnalyticsDashboardCard } from "@/components/analytics/AnalyticsDashboardCard";
import { AnalyticsSearchBar } from "@/components/analytics/AnalyticsSearchBar";
import type { AnalyticsDashboard } from "@/types/analytics";

export const metadata: Metadata = {
  title: "Analytics — Brusync OS",
};

function Section({
  title,
  dashboards,
  favoriteIds,
}: {
  title: string;
  dashboards: AnalyticsDashboard[];
  favoriteIds: Set<string>;
}) {
  if (dashboards.length === 0) return null;
  return (
    <div>
      <div className="crm-card-title" style={{ marginBottom: 10 }}>
        {title}
      </div>
      <div
        className="crm-proc-category-grid"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >
        {dashboards.map((dashboard) => (
          <AnalyticsDashboardCard
            key={dashboard.id}
            dashboard={dashboard}
            isFavorite={favoriteIds.has(dashboard.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const data = await fetchDashboardsPageData();
  const favoriteIds = new Set(data.favorites.map((d) => d.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <AnalyticsSearchBar />
      <AnalyticsCreateDashboardForm />

      <Section title="Favoritos" dashboards={data.favorites} favoriteIds={favoriteIds} />
      <Section title="Recentes" dashboards={data.recent} favoriteIds={favoriteIds} />
      <Section title="Compartilhados comigo" dashboards={data.shared} favoriteIds={favoriteIds} />
      <Section title="Todos os dashboards" dashboards={data.dashboards} favoriteIds={favoriteIds} />

      {data.dashboards.length === 0 && (
        <div className="crm-card crm-card-pad">
          <p className="crm-card-sub">Nenhum dashboard criado ainda. Crie o primeiro acima.</p>
        </div>
      )}
    </div>
  );
}
