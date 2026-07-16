import type { ComponentType } from "react";
import {
  BiDashboardDesktop,
  BiDashboardMobile,
  BiFinanceiro,
  BiKpis,
  BiRelatorios,
} from "@/components/cases/screens/bi";
import {
  CrmAgendaMobile,
  CrmConfiguracoes,
  CrmDashboard,
  CrmLead,
  CrmPipeline,
} from "@/components/cases/screens/crm";
import {
  ErpDashboard,
  ErpEstoque,
  ErpFinanceiro,
  ErpPedidosMobile,
  ErpRelatorios,
} from "@/components/cases/screens/erp";
import {
  OmniAutomacoes,
  OmniChatMobile,
  OmniDashboard,
  OmniInbox,
  OmniRelatorios,
} from "@/components/cases/screens/omni";
import type { DeviceVariant } from "@/components/dashboard-mock/primitives/DeviceFrame";

export interface CaseScreen {
  title: string;
  description: string;
  device: DeviceVariant;
  Component: ComponentType;
}

export interface CaseStat {
  value: string;
  label: string;
}

export interface CaseItem {
  slug: string;
  name: string;
  category: string;
  summary: string;
  description: string;
  techStack: string[];
  features: string[];
  stats: CaseStat[];
  screens: CaseScreen[];
}

export const cases: CaseItem[] = [
  {
    slug: "dashboard-executivo-white-label",
    name: "Dashboard Executivo White Label",
    category: "Business Intelligence",
    summary:
      "Painel executivo que cruza marketing, comercial e financeiro em uma única visão, com alertas e insights gerados por IA.",
    description:
      "Uma plataforma de Business Intelligence construída para dar ao time executivo uma visão única e em tempo real da operação. Receita, lucro, ROAS e CAC são calculados a partir de dados que hoje vivem espalhados em Google Ads, Meta Ads, CRM e ERP — tudo convergindo para o mesmo painel, com a marca e o domínio do cliente.",
    techStack: [
      "Next.js",
      "React",
      "TypeScript",
      "PostgreSQL",
      "Supabase",
      "Tailwind CSS",
      "API REST",
    ],
    features: [
      "Dashboard executivo unificado com KPIs de receita, lucro, ROAS e CAC em tempo real",
      "Integração nativa com Google Ads e Meta Ads para acompanhar performance de mídia paga",
      "Conexão direta com CRM e ERP, centralizando dados comerciais e financeiros",
      "Painel financeiro completo com comparativos automáticos mês a mês",
      "Gráficos modernos e interativos, construídos sob medida para cada indicador",
      "Alertas inteligentes que avisam sobre variações relevantes antes que virem problema",
      "IA gerando insights automáticos a partir dos dados cruzados de todas as áreas",
      "Layout responsivo, do desktop ao mobile, sem perder nenhuma informação crítica",
    ],
    stats: [
      { value: "12+", label: "Fontes de dados integradas" },
      { value: "98,7%", label: "Precisão dos alertas de IA" },
      { value: "3,2s", label: "Tempo médio de carregamento" },
      { value: "100%", label: "White label" },
    ],
    screens: [
      {
        title: "Dashboard Executivo",
        description:
          "Visão consolidada de receita, lucro, ROAS e CAC, com alertas gerados por IA em destaque.",
        device: "browser",
        Component: BiDashboardDesktop,
      },
      {
        title: "Dashboard Mobile",
        description:
          "A mesma inteligência do desktop, redesenhada para consulta rápida em qualquer lugar.",
        device: "mobile",
        Component: BiDashboardMobile,
      },
      {
        title: "Painel de KPIs",
        description:
          "Indicadores comerciais e de marketing lado a lado, com comparativo entre meta e realizado.",
        device: "tablet",
        Component: BiKpis,
      },
      {
        title: "Painel Financeiro",
        description:
          "Fluxo de caixa, distribuição de custos e detalhamento por categoria em um único painel.",
        device: "notebook",
        Component: BiFinanceiro,
      },
      {
        title: "Central de Relatórios",
        description:
          "Relatórios executivos gerados automaticamente, com insights de IA sempre em destaque.",
        device: "browser",
        Component: BiRelatorios,
      },
    ],
  },
  {
    slug: "crm-comercial-inteligente",
    name: "CRM Comercial Inteligente",
    category: "CRM",
    summary:
      "CRM com pipeline visual, WhatsApp integrado e IA resumindo conversas para acelerar o fechamento de vendas.",
    description:
      "Um CRM desenhado em torno do jeito real como o time comercial trabalha: pipeline visual, WhatsApp integrado direto na conversa com o lead e uma camada de Inteligência Artificial que resume interações, sugere follow-ups e garante que nenhuma oportunidade esfrie no funil.",
    techStack: [
      "Next.js",
      "React",
      "TypeScript",
      "PostgreSQL",
      "Supabase",
      "WhatsApp Business API",
      "OpenAI API",
    ],
    features: [
      "Pipeline visual em Kanban, com etapas personalizadas para o processo comercial",
      "Gestão completa de leads, do primeiro contato ao fechamento",
      "Integração nativa com WhatsApp para atender sem sair do CRM",
      "Histórico completo de interações centralizado por lead",
      "Agenda integrada com lembretes automáticos de follow-up",
      "IA resumindo conversas inteiras em segundos",
      "Automações comerciais configuráveis sem depender de TI",
      "Notificações em tempo real para não perder nenhuma oportunidade",
    ],
    stats: [
      { value: "24,6%", label: "Taxa média de conversão" },
      { value: "-38%", label: "Tempo de resposta ao lead" },
      { value: "9", label: "Automações ativas por padrão" },
      { value: "100%", label: "Dados do cliente, sem intermediários" },
    ],
    screens: [
      {
        title: "Dashboard",
        description: "Funil, conversão e vendas do mês, com um resumo diário gerado por IA.",
        device: "notebook",
        Component: CrmDashboard,
      },
      {
        title: "Pipeline",
        description: "Kanban comercial com valor, etapa e responsável por cada oportunidade.",
        device: "browser",
        Component: CrmPipeline,
      },
      {
        title: "Lead",
        description:
          "Perfil completo do lead com o histórico de WhatsApp e resumo automático da IA.",
        device: "tablet",
        Component: CrmLead,
      },
      {
        title: "Agenda",
        description: "Compromissos e follow-ups do dia, sempre à mão no celular.",
        device: "mobile",
        Component: CrmAgendaMobile,
      },
      {
        title: "Configurações",
        description: "Regras de automação comercial configuráveis por qualquer pessoa do time.",
        device: "browser",
        Component: CrmConfiguracoes,
      },
    ],
  },
  {
    slug: "sistema-gestao-empresarial",
    name: "Sistema de Gestão Empresarial",
    category: "ERP",
    summary:
      "ERP modular com financeiro, estoque, pedidos e compras integrados em um único sistema sob medida.",
    description:
      "Um ERP construído módulo a módulo para a realidade da operação: financeiro com fluxo de caixa em tempo real, estoque com alertas de ruptura, pedidos do recebimento à faturação e compras conectadas a fornecedores — tudo em uma única fonte de verdade, sem planilhas paralelas.",
    techStack: ["Next.js", "React", "TypeScript", "PostgreSQL", "Node.js", "Supabase", "API REST"],
    features: [
      "Financeiro completo com contas a pagar, a receber e fluxo de caixa",
      "Controle de estoque com alertas automáticos de nível crítico",
      "Gestão de pedidos, do recebimento à faturação",
      "Módulo de compras e fornecedores integrado ao estoque",
      "Cadastro único de clientes e fornecedores",
      "Relatórios gerenciais exportáveis para decisões rápidas",
      "Dashboard executivo com a saúde da operação em um único lugar",
      "Arquitetura modular, pronta para crescer junto com a operação",
    ],
    stats: [
      { value: "1.240", label: "Pedidos processados por mês" },
      { value: "486", label: "SKUs monitorados em tempo real" },
      { value: "-22%", label: "Rupturas de estoque" },
      { value: "100%", label: "Dados em um único sistema" },
    ],
    screens: [
      {
        title: "Dashboard",
        description: "Faturamento, pedidos e alertas de estoque crítico em uma única tela.",
        device: "browser",
        Component: ErpDashboard,
      },
      {
        title: "Financeiro",
        description: "Contas a pagar e a receber, fluxo de caixa projetado e títulos em atraso.",
        device: "notebook",
        Component: ErpFinanceiro,
      },
      {
        title: "Pedidos",
        description: "Acompanhamento de pedidos por status, direto do celular na operação.",
        device: "mobile",
        Component: ErpPedidosMobile,
      },
      {
        title: "Estoque",
        description: "Nível de estoque por produto, com destaque automático para itens críticos.",
        device: "tablet",
        Component: ErpEstoque,
      },
      {
        title: "Relatórios",
        description: "Fechamento financeiro, posição de estoque e curva de fornecedores.",
        device: "browser",
        Component: ErpRelatorios,
      },
    ],
  },
  {
    slug: "central-omnichannel",
    name: "Central Omnichannel",
    category: "Atendimento",
    summary:
      "WhatsApp, Instagram e Messenger em uma única inbox, com IA respondendo e priorizando conversas.",
    description:
      "Uma central de atendimento que reúne WhatsApp, Instagram e Messenger em uma inbox só, com uma camada de IA que responde dúvidas frequentes, sugere respostas para o time e garante que nenhuma conversa fique esquecida — independente do canal em que o cliente chegou.",
    techStack: [
      "Next.js",
      "React",
      "TypeScript",
      "PostgreSQL",
      "WhatsApp Business API",
      "Meta Graph API",
      "OpenAI API",
    ],
    features: [
      "WhatsApp, Instagram e Messenger centralizados em uma única inbox",
      "Histórico completo por cliente, independente do canal de origem",
      "IA respondendo automaticamente as dúvidas mais frequentes",
      "Etiquetas inteligentes para organizar e priorizar conversas",
      "Transferência de atendimento entre times sem perder contexto",
      "Automações configuráveis para cada etapa do atendimento",
      "Dashboard com tempo de resposta, CSAT e volume por canal",
      "Relatórios de performance por atendente e por canal",
    ],
    stats: [
      { value: "184", label: "Conversas atendidas por dia" },
      { value: "48s", label: "Tempo médio de 1ª resposta" },
      { value: "61%", label: "Resolvido automaticamente pela IA" },
      { value: "96%", label: "Satisfação dos clientes (CSAT)" },
    ],
    screens: [
      {
        title: "Inbox",
        description: "Todas as conversas, de todos os canais, organizadas em um só lugar.",
        device: "browser",
        Component: OmniInbox,
      },
      {
        title: "Dashboard",
        description: "Volume de conversas, tempo de resposta e satisfação por canal.",
        device: "notebook",
        Component: OmniDashboard,
      },
      {
        title: "Chat",
        description: "Conversa individual com sugestão de resposta gerada por IA.",
        device: "mobile",
        Component: OmniChatMobile,
      },
      {
        title: "Automações",
        description: "Regras de resposta automática, triagem e transferência entre times.",
        device: "tablet",
        Component: OmniAutomacoes,
      },
      {
        title: "Relatórios",
        description: "Volume por atendente e satisfação (CSAT) segmentada por canal.",
        device: "browser",
        Component: OmniRelatorios,
      },
    ],
  },
];

export function getCase(slug: string) {
  return cases.find((c) => c.slug === slug);
}
