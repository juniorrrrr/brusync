export interface CaseItem {
  slug: string;
  title: string;
  segment: string;
  description: string;
  tags: string[];
}

export const cases: CaseItem[] = [
  {
    slug: "dashboard-executivo-white-label",
    title: "Dashboard Executivo White Label",
    segment: "Gestão executiva",
    description:
      "Painel único reunindo indicadores comerciais, financeiros e operacionais em tempo real, com a marca e o domínio do cliente do login ao relatório.",
    tags: ["White Label", "Business Intelligence", "Tempo real"],
  },
  {
    slug: "crm-comercial-personalizado",
    title: "CRM Comercial Personalizado",
    segment: "Comercial e vendas",
    description:
      "Funil de vendas desenhado para o processo comercial real da empresa, com automações de follow-up e qualificação de leads assistida por IA.",
    tags: ["CRM", "Automação", "Agentes de IA"],
  },
  {
    slug: "central-de-indicadores-integrada",
    title: "Central de Indicadores Integrada",
    segment: "Multi-setorial",
    description:
      "Convergência de dados de ERP, atendimento e financeiro em uma única central, eliminando planilhas paralelas e retrabalho entre times.",
    tags: ["Integrações", "Dashboards", "Dados unificados"],
  },
  {
    slug: "sistema-gestao-prestadores-servico",
    title: "Sistema de Gestão para Prestadores de Serviço",
    segment: "Prestação de serviços",
    description:
      "Plataforma própria para agendamento, ordens de serviço e faturamento, substituindo três ferramentas soltas por um sistema único e sob medida.",
    tags: ["Software sob medida", "Operação", "Faturamento"],
  },
];
