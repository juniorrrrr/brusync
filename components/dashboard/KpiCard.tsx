import type { ComponentType } from "react";
import type { IconProps } from "@/components/ui/icons";

export function KpiCard({
  label,
  value,
  delta,
  direction,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  direction: "up" | "down";
  icon: ComponentType<IconProps>;
}) {
  return (
    <div className="crm-kpi">
      <div className="crm-kpi-top">
        <span className="crm-kpi-label">{label}</span>
        <span className="crm-kpi-ico">
          <Icon size={16} />
        </span>
      </div>
      <div className="crm-kpi-val">{value}</div>
      <div className={`crm-kpi-delta ${direction}`}>
        {direction === "up" ? "↑" : "↓"} {delta}
      </div>
    </div>
  );
}
