import {
  IconArrowSwap,
  IconBuilding,
  IconChart,
  IconCheck,
  IconDoc,
  IconFunnel,
  IconGrid,
  IconPackage,
  IconRobot,
  IconSettings,
  IconTarget,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";
import type { NavSection } from "@/types/crm";

export const CRM_NAV: NavSection[] = [
  {
    title: "Geral",
    items: [{ label: "Dashboard", href: "/dashboard", icon: IconGrid }],
  },
  {
    title: "CRM",
    items: [
      { label: "Leads", href: "/leads", icon: IconTarget },
      { label: "Pipeline", href: "/pipeline", icon: IconFunnel },
      { label: "Clientes", icon: IconBuilding, soon: true },
    ],
  },
  {
    title: "Gestão",
    items: [
      { label: "Projetos", icon: IconDoc, soon: true },
      { label: "Financeiro", icon: IconWallet, soon: true },
      { label: "Materiais", icon: IconPackage, soon: true },
    ],
  },
  {
    title: "Inteligência",
    items: [
      { label: "Analytics", icon: IconChart, soon: true },
      { label: "Integrações", icon: IconArrowSwap, soon: true },
      { label: "IA", icon: IconRobot, soon: true },
    ],
  },
  {
    title: "Sistema",
    items: [
      { label: "Configurações", href: "/configuracoes", icon: IconSettings },
      { label: "Usuários", href: "/usuarios", icon: IconUsers },
      { label: "Permissões", icon: IconCheck, soon: true },
    ],
  },
];
