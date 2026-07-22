import type { ComponentType, ReactNode } from "react";
import type { IconProps } from "@/components/ui/icons";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
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
      {hint && <div className="crm-kpi-delta">{hint}</div>}
    </div>
  );
}
