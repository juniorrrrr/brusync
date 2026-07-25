"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/performance", label: "Executivo" },
  { href: "/performance/comercial", label: "Comercial" },
  { href: "/performance/financeiro", label: "Financeiro" },
  { href: "/performance/marketing", label: "Marketing" },
  { href: "/performance/equipe", label: "Equipe" },
  { href: "/performance/individual", label: "Individual" },
  { href: "/performance/metas", label: "Metas" },
];

/** Mesmo padrão de components/revenueIntelligence/RevenueSubNav.tsx —
 * navegação por rota real (<Link>), não troca de painel client-side. */
export function PerformanceSubNav() {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      aria-label="Módulos de Performance"
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
