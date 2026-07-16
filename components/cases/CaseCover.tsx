import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const CATEGORY_STYLE: Record<string, { gradient: string; icon: ReactNode }> = {
  "Business Intelligence": {
    gradient: "linear-gradient(135deg, #1F5EFF, #25D0C3)",
    icon: (
      <svg
        aria-hidden="true"
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 3 3 5-6" />
      </svg>
    ),
  },
  CRM: {
    gradient: "linear-gradient(135deg, #081C3A, #1F5EFF)",
    icon: (
      <svg
        aria-hidden="true"
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M2 20c0-3.3 3-6 7-6s7 2.7 7 6" />
        <circle cx="18" cy="9" r="2.4" />
        <path d="M17 14.2c2.3.4 4 2.3 4 5.8" />
      </svg>
    ),
  },
  ERP: {
    gradient: "linear-gradient(135deg, #25D0C3, #081C3A)",
    icon: (
      <svg
        aria-hidden="true"
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="m21 8-9-5-9 5 9 5 9-5z" />
        <path d="M3 8v8l9 5 9-5V8M12 13v8" />
      </svg>
    ),
  },
  Atendimento: {
    gradient: "linear-gradient(135deg, #1F5EFF, #081C3A)",
    icon: (
      <svg
        aria-hidden="true"
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20l1.1-5.3A8.4 8.4 0 0 1 3 11.5 8.4 8.4 0 0 1 11.5 3a8.4 8.4 0 0 1 9.5 8.5z" />
      </svg>
    ),
  },
};

export function CaseCover({ category, className }: { category: string; className?: string }) {
  const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.CRM;
  return (
    <div className={cn(className)} style={{ background: style.gradient }}>
      {style.icon}
    </div>
  );
}
