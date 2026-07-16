import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("panel", className)}>
      <div className="p-label">{label}</div>
      {children}
    </div>
  );
}
