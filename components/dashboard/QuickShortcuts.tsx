import Link from "next/link";
import type { ComponentType } from "react";
import {
  IconCalendar,
  IconChart,
  IconDoc,
  IconPhone,
  type IconProps,
  IconTarget,
  IconWallet,
} from "@/components/ui/icons";

const SHORTCUTS: { label: string; href: string; icon: ComponentType<IconProps> }[] = [
  { label: "CRM", href: "/pipeline", icon: IconTarget },
  { label: "Projetos", href: "/projetos", icon: IconDoc },
  { label: "Agenda", href: "/agenda", icon: IconCalendar },
  { label: "Financeiro", href: "/financeiro", icon: IconWallet },
  { label: "Analytics", href: "/analytics", icon: IconChart },
  { label: "WhatsApp", href: "/whatsapp", icon: IconPhone },
];

/** Porta de entrada do sistema (Fase 33): atalhos para os módulos mais
 * usados, evitando depender só da sidebar para navegação rápida. */
export function QuickShortcuts() {
  return (
    <div className="crm-dash-shortcuts">
      {SHORTCUTS.map(({ label, href, icon: Icon }) => (
        <Link key={href} href={href} className="crm-dash-shortcut">
          <Icon size={18} />
          <span>{label}</span>
        </Link>
      ))}
    </div>
  );
}
