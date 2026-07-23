import {
  IconArrowSwap,
  IconBolt,
  IconBuilding,
  IconCalendar,
  IconChart,
  IconCheck,
  IconCheckCircle,
  IconDoc,
  IconFunnel,
  IconGrid,
  IconPackage,
  IconReport,
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
      { label: "Clientes", href: "/clientes", icon: IconBuilding },
      { label: "Agenda", href: "/agenda", icon: IconCalendar },
    ],
  },
  {
    title: "Gestão",
    items: [
      { label: "Projetos", href: "/projetos", icon: IconDoc },
      { label: "Financeiro", href: "/financeiro", icon: IconWallet },
      { label: "Materiais", icon: IconPackage, soon: true },
    ],
  },
  {
    title: "Inteligência",
    items: [
      { label: "Marketing Intelligence", href: "/marketing", icon: IconReport },
      { label: "Analytics", icon: IconChart, soon: true },
      { label: "Conversões", href: "/conversoes", icon: IconCheckCircle },
      { label: "Integrações", href: "/integracoes", icon: IconArrowSwap },
      { label: "Automações", href: "/automacoes", icon: IconBolt },
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
