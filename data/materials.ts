export interface MaterialItem {
  slug: string;
  title: string;
  format: string;
  description: string;
}

export const materials: MaterialItem[] = [
  {
    slug: "checklist-digitalizacao-empresarial",
    title: "Checklist para digitalização empresarial",
    format: "Checklist",
    description:
      "Um roteiro prático para mapear quais processos da sua empresa ainda dependem de planilhas e ferramentas soltas — e por onde começar a digitalizar.",
  },
  {
    slug: "guia-integracao-entre-sistemas",
    title: "Guia de integração entre sistemas",
    format: "Guia",
    description:
      "Como conectar CRM, ERP, financeiro e atendimento em um único fluxo de dados, evitando retrabalho e decisões baseadas em informação desatualizada.",
  },
  {
    slug: "como-escolher-software-white-label",
    title: "Como escolher um software White Label",
    format: "Guia comparativo",
    description:
      "Os critérios que realmente importam na hora de decidir entre alugar uma plataforma pronta ou investir em um sistema próprio para a sua empresa.",
  },
];
