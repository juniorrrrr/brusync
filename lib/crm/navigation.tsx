import {
  IconArrowSwap,
  IconBolt,
  IconBook,
  IconBuilding,
  IconCalendar,
  IconChart,
  IconCheck,
  IconCheckCircle,
  IconCheckSquare,
  IconDoc,
  IconFolder,
  IconFunnel,
  IconGrid,
  IconLayers,
  IconMessage,
  IconPackage,
  IconReport,
  IconRobot,
  IconSettings,
  IconTag,
  IconTarget,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";
import type { NavSection } from "@/types/crm";

export const CRM_NAV: NavSection[] = [
  {
    title: "Geral",
    items: [
      { label: "Central de Operações", href: "/operacoes", icon: IconLayers },
      { label: "Dashboard", href: "/dashboard", icon: IconGrid },
    ],
  },
  {
    title: "CRM",
    items: [
      { label: "Leads", href: "/leads", icon: IconTarget },
      { label: "Pipeline", href: "/pipeline", icon: IconFunnel },
      { label: "Clientes", href: "/clientes", icon: IconBuilding },
      { label: "Agenda", href: "/agenda", icon: IconCalendar },
      { label: "Comunicação", href: "/comunicacao", icon: IconMessage },
    ],
  },
  {
    title: "Gestão",
    items: [
      { label: "Projetos", href: "/projetos", icon: IconDoc },
      { label: "Financeiro", href: "/financeiro", icon: IconWallet },
      { label: "Base de Conhecimento", href: "/base-conhecimento", icon: IconBook },
      { label: "Playbooks", href: "/playbooks", icon: IconBook },
      { label: "Processos", href: "/processos", icon: IconFolder },
      { label: "Equipe", href: "/equipe", icon: IconUsers },
      { label: "Materiais", icon: IconPackage, soon: true },
    ],
  },
  {
    title: "Inteligência",
    items: [
      { label: "Central de Inteligência", href: "/inteligencia", icon: IconChart },
      { label: "Marketing Intelligence", href: "/marketing", icon: IconReport },
      { label: "Revenue Intelligence", href: "/receita", icon: IconTag },
      { label: "Performance", href: "/performance", icon: IconCheckSquare },
      { label: "Conversões", href: "/conversoes", icon: IconCheckCircle },
      { label: "Integrações", href: "/integracoes", icon: IconArrowSwap },
      { label: "Automações", href: "/automacoes", icon: IconBolt },
      { label: "IA", href: "/ia", icon: IconRobot },
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
