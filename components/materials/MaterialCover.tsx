import type { ReactNode } from "react";
import type { MaterialTopic } from "@/data/materials";
import { cn } from "@/lib/utils";

const TOPIC_STYLE: Record<MaterialTopic, { gradient: string; icon: ReactNode }> = {
  whitelabel: {
    gradient: "linear-gradient(135deg, #081C3A, #1F5EFF)",
    icon: (
      <svg
        aria-hidden="true"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M20.6 12.6 12 21.2 2.8 12 2 6l6-.8 8.6 8.6z" />
        <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  ai: {
    gradient: "linear-gradient(135deg, #1F5EFF, #25D0C3)",
    icon: (
      <svg
        aria-hidden="true"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="4" y="8" width="16" height="12" rx="3" />
        <path d="M12 8V4M9 4h6" />
        <circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  digital: {
    gradient: "linear-gradient(135deg, #25D0C3, #081C3A)",
    icon: (
      <svg
        aria-hidden="true"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  integration: {
    gradient: "linear-gradient(135deg, #1F5EFF, #081C3A)",
    icon: (
      <svg
        aria-hidden="true"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="18" r="3" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M8.6 6h6.8M8.6 18h6.8M6 8.6v6.8M18 8.6v6.8" />
      </svg>
    ),
  },
  kpi: {
    gradient: "linear-gradient(135deg, #081C3A, #25D0C3)",
    icon: (
      <svg
        aria-hidden="true"
        width="30"
        height="30"
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
  strategy: {
    gradient: "linear-gradient(135deg, #25D0C3, #1F5EFF)",
    icon: (
      <svg
        aria-hidden="true"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  choice: {
    gradient: "linear-gradient(135deg, #081C3A, #1F5EFF)",
    icon: (
      <svg
        aria-hidden="true"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
};

export function MaterialCover({
  topic,
  title,
  format,
  className,
}: {
  topic: MaterialTopic;
  title: string;
  format: string;
  className?: string;
}) {
  const style = TOPIC_STYLE[topic];
  return (
    <div className={cn(className)} style={{ background: style.gradient }}>
      <div className="mat-cover-top">
        <span className="mat-format-pill">{format}</span>
        {style.icon}
      </div>
      <div className="mat-cover-title">{title}</div>
    </div>
  );
}
