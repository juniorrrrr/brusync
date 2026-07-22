"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/integracoes", label: "Painel" },
  { href: "/integracoes/logs", label: "Logs" },
  { href: "/integracoes/saude", label: "Saúde" },
];

/** Same visual pattern as MarketingSubNav — real routes, not panel-content
 * switching, styled to look like the Radix Tabs primitive via the shadcn/
 * 21st.dev Tailwind token bridge (bg-muted, text-foreground, ...). */
export function IntegrationsSubNav() {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      aria-label="Módulos de Integrações"
      className="bg-muted text-muted-foreground relative inline-flex h-9 w-fit items-center justify-center gap-1 rounded-lg p-[3px] overflow-x-auto max-w-full"
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={`inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-3.5 py-1 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
