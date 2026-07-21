import type { ComponentType } from "react";
import type { IconProps } from "@/components/ui/icons";
import { IconSearch } from "@/components/ui/icons";

export function NoResults({
  icon: Icon = IconSearch,
  title,
  description,
}: {
  icon?: ComponentType<IconProps>;
  title: string;
  description: string;
}) {
  return (
    <div className="crm-empty">
      <div className="crm-empty-ico">
        <Icon size={26} />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
