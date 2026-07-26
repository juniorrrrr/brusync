"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/equipe", label: "Dashboard" },
  { href: "/equipe/colaboradores", label: "Colaboradores" },
  { href: "/equipe/individual", label: "Individual" },
  { href: "/equipe/metas", label: "Metas" },
  { href: "/equipe/feedback", label: "Feedback" },
  { href: "/equipe/checkins", label: "Check-ins" },
];

/** Mesmo padrão de components/performance/PerformanceSubNav.tsx — navegação
 * por rota real, não troca de painel client-side. */
export function TeamSubNav() {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      aria-label="Módulos de Equipe"
      className="bg-muted text-muted-foreground relative inline-flex h-9 w-fit items-center justify-center gap-1 rounded-lg p-[3px] overflow-x-auto max-w-full"
    >
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/equipe" ? pathname === tab.href : pathname.startsWith(tab.href);
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
