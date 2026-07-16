import type { ComponentType } from "react";
import type { IconProps } from "@/components/ui/icons";
import { IconBolt } from "@/components/ui/icons";

export function EmptyState({
  icon: Icon = IconBolt,
  title,
  description,
}: {
  icon?: ComponentType<IconProps>;
  title: string;
  description: string;
}) {
  return (
    <div className="crm-card crm-empty">
      <div className="crm-empty-ico">
        <Icon size={26} />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      <span className="crm-badge info">Em desenvolvimento</span>
    </div>
  );
}
