export type MaterialTopic =
  | "whitelabel"
  | "ai"
  | "integration"
  | "digital"
  | "kpi"
  | "strategy"
  | "choice";

export interface MaterialItem {
  slug: string;
  title: string;
  category: string;
  format: string;
  description: string;
  pages?: number;
  readingTime: string;
  fileName: string;
  fileSizeLabel: string;
  date: string;
  tag: string;
  topic: MaterialTopic;
  includes: string[];
}

export const materials: MaterialItem[] = [
  {
    slug: "como-criar-software-white-label",
    title: "Como criar um software White Label para sua empresa",
    category: "eBook",
    format: "PDF",
    description:
      "Um guia completo para sair do software genérico e construir uma plataforma própria — com sua marca, seu domínio e suas regras de negócio.",
    pages: 28,
    readingTime: "38 min de leitura",
    fileName: "como-criar-software-white-label.pdf",
    fileSizeLabel: "45 KB",
    date: "2026-06-02",
    tag: "White Label",
    topic: "whitelabel",
    includes: [
      "Os 5 pilares da propriedade digital",
      "Checklist de planejamento inicial",
      "As 6 etapas de um projeto White Label",
      "Erros comuns ao migrar (e como evitar)",
    ],
  },
  {
    slug: "inteligencia-artificial-aplicada-aos-negocios",
    title: "Inteligência Artificial aplicada aos negócios",
    category: "eBook",
    format: "PDF",
    description:
      "Como sair do discurso e colocar a IA para operar de verdade dentro da sua empresa — com dados próprios e resultado mensurável.",
    pages: 28,
    readingTime: "38 min de leitura",
    fileName: "inteligencia-artificial-aplicada-aos-negocios.pdf",
    fileSizeLabel: "44 KB",
    date: "2026-05-14",
    tag: "Inteligência Artificial",
    topic: "ai",
    includes: [
      "De ferramenta de apoio a agente de execução",
      "Onde a IA gera valor real, hoje",
      "Um roteiro de implementação em semanas",
      "Governança e uso responsável de IA",
    ],
  },
  {
    slug: "checklist-transformacao-digital-empresarial",
    title: "Transformação Digital Empresarial",
    category: "Checklist",
    format: "PDF",
    description:
      "Um checklist prático para mapear o quanto a sua operação ainda depende de planilhas e processos manuais — e por onde começar a resolver isso.",
    pages: 18,
    readingTime: "22 min de leitura",
    fileName: "checklist-transformacao-digital-empresarial.pdf",
    fileSizeLabel: "29 KB",
    date: "2026-04-20",
    tag: "Transformação Digital",
    topic: "digital",
    includes: [
      "6 seções de diagnóstico prontas para usar",
      "Itens de segurança e conformidade (LGPD)",
      "Modelo de plano de ação e priorização",
    ],
  },
  {
    slug: "guia-integracao-sistemas-empresariais",
    title: "Integração entre sistemas empresariais",
    category: "Guia",
    format: "PDF",
    description:
      "Como conectar CRM, ERP, financeiro e atendimento em um único fluxo de dados — evitando retrabalho e decisões baseadas em informação desatualizada.",
    pages: 19,
    readingTime: "24 min de leitura",
    fileName: "guia-integracao-sistemas-empresariais.pdf",
    fileSizeLabel: "30 KB",
    date: "2026-03-11",
    tag: "Integrações",
    topic: "integration",
    includes: [
      "APIs, webhooks e sincronização explicados",
      "Checklist de priorização de integrações",
      "Por que integração é pré-requisito para IA",
    ],
  },
  {
    slug: "template-kpis-para-ceos",
    title: "Template de KPIs para CEOs",
    category: "Template",
    format: "Excel (.xlsx)",
    description:
      "Planilha com fórmulas prontas para acompanhar receita, lucro, CAC, LTV, ROI, ROAS, margem e conversão mês a mês.",
    readingTime: "Pronto para preencher",
    fileName: "template-kpis-para-ceos.xlsx",
    fileSizeLabel: "10 KB",
    date: "2026-06-25",
    tag: "Indicadores",
    topic: "kpi",
    includes: [
      "Painel mensal com 16 indicadores calculados por fórmula",
      "Cálculo automático de CAC, LTV, ROAS e ROI",
      "Aba explicando cada indicador em detalhe",
    ],
  },
  {
    slug: "template-planejamento-estrategico",
    title: "Planejamento Estratégico Empresarial",
    category: "Template",
    format: "Excel (.xlsx)",
    description:
      "Planilha com missão e visão, análise SWOT, OKRs e plano de ação — pronta para adaptar ao próximo ciclo de planejamento.",
    readingTime: "Pronto para preencher",
    fileName: "template-planejamento-estrategico.xlsx",
    fileSizeLabel: "9 KB",
    date: "2026-07-02",
    tag: "Estratégia",
    topic: "strategy",
    includes: [
      "Abas de Missão, Visão e Valores e Análise SWOT",
      "Tabela de OKRs com progresso calculado por fórmula",
      "Modelo de plano de ação com prioridade e responsável",
    ],
  },
  {
    slug: "checklist-como-escolher-software-personalizado",
    title: "Como escolher um software personalizado",
    category: "Checklist",
    format: "PDF",
    description:
      "Os critérios que realmente importam na hora de decidir entre alugar uma plataforma pronta ou investir em um sistema próprio.",
    pages: 15,
    readingTime: "18 min de leitura",
    fileName: "checklist-como-escolher-software-personalizado.pdf",
    fileSizeLabel: "24 KB",
    date: "2026-02-18",
    tag: "Decisão de compra",
    topic: "choice",
    includes: [
      "Perguntas certas para a reunião comercial",
      "Red flags para fugir de uma proposta ruim",
      "Critérios técnicos e de parceria essenciais",
    ],
  },
];

export function getMaterial(slug: string) {
  return materials.find((m) => m.slug === slug);
}
