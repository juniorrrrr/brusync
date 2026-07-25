import type { Metadata } from "next";
import { fetchRevenueHeatmapsData } from "@/application/revenueIntelligence/revenueIntelligenceQueries";
import { Heatmap } from "@/components/revenueIntelligence/Heatmap";

export const metadata: Metadata = {
  title: "Mapas de Calor — Revenue Intelligence — Brusync OS",
};

export default async function ReceitaMapasPage() {
  const data = await fetchRevenueHeatmapsData();

  return (
    <div>
      <p className="crm-card-sub" style={{ marginBottom: 16 }}>
        "Mapa de horários" e "mapa de dias" foram combinados num único heatmap (dia da semana ×
        hora) — leitura padrão de mercado para essa dupla de dimensões. "Mapa de pipeline" aparece
        cruzado com origem e com cidade, mostrando em qual etapa cada uma está concentrada.
      </p>

      <div className="crm-rev-heatmaps-stack">
        <Heatmap grid={data.hourWeekday} />
        <Heatmap grid={data.month} />
        <Heatmap grid={data.originStage} />
        <Heatmap grid={data.cityStage} />
      </div>
    </div>
  );
}
