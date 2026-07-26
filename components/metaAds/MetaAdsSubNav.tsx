"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/meta-ads", label: "Dashboard" },
  { href: "/meta-ads/campanhas", label: "Campanhas" },
  { href: "/meta-ads/criativos", label: "Criativos" },
  { href: "/meta-ads/publicos", label: "Públicos" },
  { href: "/meta-ads/configuracoes", label: "Configurações" },
];

/** Mesmo padrão de components/whatsapp/WhatsappSubNav.tsx. */
export function MetaAdsSubNav() {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      aria-label="Módulos do Meta Ads"
      className="bg-muted text-muted-foreground relative inline-flex h-9 w-fit items-center justify-center gap-1 rounded-lg p-[3px] overflow-x-auto max-w-full"
    >
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/meta-ads" ? pathname === tab.href : pathname.startsWith(tab.href);
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
