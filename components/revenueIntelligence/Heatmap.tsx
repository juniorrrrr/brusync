import type { HeatmapGrid } from "@/types/revenueIntelligence";

function cellBackground(value: number, maxValue: number): string {
  if (maxValue <= 0 || value <= 0) return "var(--surface)";
  const intensity = value / maxValue;
  return `rgba(37, 99, 235, ${(0.12 + intensity * 0.68).toFixed(2)})`;
}

/** Primitivo novo desta fase — não existia heatmap no projeto. Grid de CSS
 * puro (sem SVG), mesmo espírito hand-built de components/dashboard-mock/
 * primitives/charts.tsx, reaproveitável para as 4 combinações de dimensões
 * pedidas no briefing (hora×dia, mês, origem×etapa, cidade×etapa). */
export function Heatmap({ grid }: { grid: HeatmapGrid }) {
  const valueByCell = new Map(
    grid.cells.map((cell) => [`${cell.rowIndex}:${cell.colIndex}`, cell.value]),
  );

  return (
    <div className="crm-rev-heatmap">
      <div className="crm-rev-heatmap-title">{grid.title}</div>
      <div
        className="crm-rev-heatmap-grid"
        style={{ gridTemplateColumns: `auto repeat(${grid.colLabels.length}, minmax(28px, 1fr))` }}
      >
        <div className="crm-rev-heatmap-corner" />
        {grid.colLabels.map((label) => (
          <div key={label} className="crm-rev-heatmap-col-label">
            {label}
          </div>
        ))}
        {grid.rowLabels.map((rowLabel, rowIndex) => (
          <div className="crm-rev-heatmap-row" key={rowLabel}>
            <div className="crm-rev-heatmap-row-label">{rowLabel}</div>
            {grid.colLabels.map((colLabel, colIndex) => {
              const value = valueByCell.get(`${rowIndex}:${colIndex}`) ?? 0;
              return (
                <div
                  key={colLabel}
                  className="crm-rev-heatmap-cell"
                  style={{ background: cellBackground(value, grid.maxValue) }}
                  title={`${rowLabel} · ${colLabel}: ${value}`}
                >
                  {value > 0 ? value : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
