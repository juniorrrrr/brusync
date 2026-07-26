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
  IconMegaphone,
  IconMessage,
  IconPackage,
  IconPhone,
  IconReport,
  IconRobot,
  IconSettings,
  IconTable,
  IconTag,
  IconTarget,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";
import type { NavGroup } from "@/types/crm";

/** Fase 33 — arquitetura de informação consolidada em grupos recolhíveis.
 * Nenhuma rota foi removida ou renomeada: apenas reorganizada por contexto
 * de uso, para reduzir a quantidade de itens visíveis simultaneamente. */
export const CRM_NAV: NavGroup[] = [
  {
    id: "dashboard",
    title: "",
    standalone: true,
    items: [{ label: "Dashboard", href: "/dashboard", icon: IconGrid }],
  },
  {
    id: "crm",
    title: "CRM",
    icon: IconTarget,
    items: [
      { label: "Leads", href: "/leads", icon: IconTarget },
      { label: "Pipeline", href: "/pipeline", icon: IconFunnel },
      { label: "Clientes", href: "/clientes", icon: IconBuilding },
    ],
  },
  {
    id: "comunicacao",
    title: "Comunicação",
    icon: IconMessage,
    items: [
      { label: "Agenda", href: "/agenda", icon: IconCalendar },
      { label: "Caixa de Entrada", href: "/comunicacao", icon: IconMessage },
      { label: "WhatsApp", href: "/whatsapp", icon: IconPhone },
    ],
  },
  {
    id: "operacoes",
    title: "Operações",
    icon: IconFolder,
    items: [
      { label: "Projetos", href: "/projetos", icon: IconDoc },
      { label: "Playbooks", href: "/playbooks", icon: IconBook },
      { label: "Processos", href: "/processos", icon: IconFolder },
      { label: "Base de Conhecimento", href: "/base-conhecimento", icon: IconBook },
      { label: "Materiais", icon: IconPackage, soon: true },
      { label: "Equipe", href: "/equipe", icon: IconUsers },
      { label: "Financeiro", href: "/financeiro", icon: IconWallet },
    ],
  },
  {
    id: "inteligencia",
    title: "Inteligência",
    icon: IconChart,
    items: [
      { label: "Analytics", href: "/analytics", icon: IconTable },
      { label: "Marketing Intelligence", href: "/marketing", icon: IconReport },
      { label: "Meta Ads", href: "/meta-ads", icon: IconMegaphone },
      { label: "Revenue Intelligence", href: "/receita", icon: IconTag },
      { label: "Performance", href: "/performance", icon: IconCheckSquare },
      { label: "Conversões", href: "/conversoes", icon: IconCheckCircle },
      { label: "Central de Inteligência", href: "/inteligencia", icon: IconChart },
      { label: "Automações", href: "/automacoes", icon: IconBolt },
      { label: "IA", href: "/ia", icon: IconRobot },
    ],
  },
  {
    id: "sistema",
    title: "Sistema",
    icon: IconSettings,
    items: [
      { label: "Central de Operações", href: "/operacoes", icon: IconLayers },
      { label: "Integrações", href: "/integracoes", icon: IconArrowSwap },
      { label: "Configurações", href: "/configuracoes", icon: IconSettings },
      { label: "Usuários", href: "/usuarios", icon: IconUsers },
      { label: "Permissões", icon: IconCheck, soon: true },
    ],
  },
];

/** Grupo (não-standalone) cuja rota corresponde ao pathname atual, usando o
 * href mais específico (mais longo) em caso de sobreposição de prefixos. */
export function getActiveGroupId(pathname: string): string | null {
  let bestGroupId: string | null = null;
  let bestHrefLength = -1;

  for (const group of CRM_NAV) {
    if (group.standalone) continue;
    for (const item of group.items) {
      if (!item.href) continue;
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        if (item.href.length > bestHrefLength) {
          bestHrefLength = item.href.length;
          bestGroupId = group.id;
        }
      }
    }
  }

  return bestGroupId;
}

export interface Breadcrumb {
  groupTitle: string | null;
  itemLabel: string;
}

/** Trilha (grupo › item) derivada do pathname atual, usada no header para
 * padronizar o título das páginas sem precisar tocar em cada uma delas. */
export function getBreadcrumb(pathname: string): Breadcrumb | null {
  let best: { group: NavGroup; item: NavGroup["items"][number] } | null = null;
  let bestHrefLength = -1;

  for (const group of CRM_NAV) {
    for (const item of group.items) {
      if (!item.href) continue;
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        if (item.href.length > bestHrefLength) {
          bestHrefLength = item.href.length;
          best = { group, item };
        }
      }
    }
  }

  if (!best) return null;
  return {
    groupTitle: best.group.standalone ? null : best.group.title,
    itemLabel: best.item.label,
  };
}
