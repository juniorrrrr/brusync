import type { ReactNode } from "react";
import type { BlogTopic } from "@/data/blog";
import { cn } from "@/lib/utils";

const TOPIC_STYLE: Record<BlogTopic, { gradient: string; icon: ReactNode }> = {
  ai: {
    gradient: "linear-gradient(135deg, #1f5eff, #25d0c3)",
    icon: (
      <svg
        aria-hidden="true"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  whitelabel: {
    gradient: "linear-gradient(135deg, #081c3a, #1f5eff)",
    icon: (
      <svg
        aria-hidden="true"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20.6 12.6 12 21.2 2.8 12 2 6l6-.8 8.6 8.6z" />
        <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  integration: {
    gradient: "linear-gradient(135deg, #25d0c3, #081c3a)",
    icon: (
      <svg
        aria-hidden="true"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="18" r="3" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M8.6 6h6.8M8.6 18h6.8M6 8.6v6.8M18 8.6v6.8" />
      </svg>
    ),
  },
};

export function BlogCover({ topic, className }: { topic: BlogTopic; className?: string }) {
  const style = TOPIC_STYLE[topic];
  return (
    <div className={cn(className)} style={{ background: style.gradient }}>
      {style.icon}
    </div>
  );
}
