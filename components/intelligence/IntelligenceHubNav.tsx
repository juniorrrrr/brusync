"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HUBS = [
  { href: "/analytics", label: "Analytics" },
  { href: "/marketing", label: "Marketing Intelligence" },
  { href: "/receita", label: "Revenue Intelligence" },
  { href: "/performance", label: "Performance" },
  { href: "/conversoes", label: "Conversões" },
];

/** Navegação integrada entre os hubs de Inteligência (Fase 33) — cada hub
 * mantém sua própria SubNav interna (abas), esta apenas permite trocar de
 * hub sem voltar à sidebar. Mesmo padrão visual de RevenueSubNav /
 * PerformanceSubNav / MarketingSubNav, mas navegando entre módulos, não
 * abas de um módulo só. */
export function IntelligenceHubNav() {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      aria-label="Hubs de Inteligência"
      className="bg-muted text-muted-foreground relative inline-flex h-9 w-fit items-center justify-center gap-1 rounded-lg p-[3px] overflow-x-auto max-w-full"
    >
      {HUBS.map((hub) => {
        const isActive = pathname === hub.href || pathname.startsWith(`${hub.href}/`);
        return (
          <Link
            key={hub.href}
            href={hub.href}
            role="tab"
            aria-selected={isActive}
            className={`inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-3.5 py-1 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"
            }`}
          >
            {hub.label}
          </Link>
        );
      })}
    </div>
  );
}
