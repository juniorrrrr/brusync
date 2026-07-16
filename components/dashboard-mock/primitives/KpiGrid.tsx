import { cn } from "@/lib/utils";

export interface KpiItem {
  label: string;
  value: string;
  delta: string;
  tone?: "up" | "down" | "warn";
}

export function KpiGrid({ items, cols = 4 }: { items: KpiItem[]; cols?: 2 | 3 | 4 }) {
  return (
    <div className={cn("kpis", cols === 2 && "cols-2", cols === 3 && "cols-3")}>
      {items.map((item) => (
        <div
          className={cn("kpi", item.tone === "down" && "down", item.tone === "warn" && "warn")}
          key={item.label}
        >
          <div className="k-label">{item.label}</div>
          <div className="k-val">{item.value}</div>
          <div className="k-delta">{item.delta}</div>
        </div>
      ))}
    </div>
  );
}
