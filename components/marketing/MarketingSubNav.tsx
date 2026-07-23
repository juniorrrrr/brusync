"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { href: "/marketing/executivo", label: "Executivo" },
  { href: "/marketing/origens", label: "Origens" },
  { href: "/marketing/campanhas", label: "Campanhas" },
  { href: "/marketing/criativos", label: "Criativos" },
  { href: "/marketing/landing-pages", label: "Landing Pages" },
  { href: "/marketing/utms", label: "UTMs" },
  { href: "/marketing/funil", label: "Funil" },
  { href: "/marketing/financeiro", label: "Financeiro" },
];

/** Navigation between distinct routes, styled like the Radix Tabs primitive
 * used elsewhere (Lead Workspace) — but plain `<Link>`s, since switching
 * dashboards here means a real URL change, not panel-content switching. */
export function MarketingSubNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <div
      role="tablist"
      aria-label="Módulos de Marketing Intelligence"
      className="bg-muted text-muted-foreground relative inline-flex h-9 w-fit items-center justify-center gap-1 rounded-lg p-[3px] overflow-x-auto max-w-full"
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={query ? `${tab.href}?${query}` : tab.href}
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
