import type { PdfDocumentData } from "../types";

export const integracaoGuia: PdfDocumentData = {
  slug: "guia-integracao-sistemas-empresariais",
  title: "Integração entre sistemas empresariais",
  subtitle:
    "Como conectar CRM, ERP, financeiro e atendimento em um único fluxo de dados confiável.",
  category: "Guia",
  blocks: [
    {
      type: "cover",
      category: "Guia · Brusync",
      title: "Integração entre sistemas empresariais",
      subtitle:
        "Como conectar CRM, ERP, financeiro e atendimento em um único fluxo de dados — evitando retrabalho e decisões baseadas em informação desatualizada.",
    },
    {
      type: "toc",
      entries: [
        { title: "Introdução", page: 1 },
        { title: "01 · O problema da desintegração de dados", page: 2 },
        { title: "02 · O que muda com integração de verdade", page: 5 },
        { title: "03 · Arquitetura: APIs, webhooks e sincronização", page: 8 },
        { title: "04 · Como priorizar o que integrar primeiro", page: 11 },
        { title: "05 · Integração como base para IA", page: 14 },
        { title: "Conclusão", page: 17 },
      ],
    },
    {
      type: "content",
      heading: "Introdução",
      paragraphs: [
        "A maioria das empresas não tem um problema de falta de dados — tem um problema de dados espalhados. Informações comerciais em uma ferramenta, financeiro em outra, atendimento em uma terceira, e no meio de tudo isso, planilhas paralelas tentando costurar o que o software não integra sozinho.",
        "Este guia explica como resolver esse problema na raiz: não com mais uma ferramenta isolada, mas com uma arquitetura de integração que faz os sistemas da empresa conversarem entre si de forma confiável.",
      ],
    },
    {
      type: "divider",
      number: "01",
      title: "O problema da desintegração de dados",
      intro: "O custo invisível de operar com sistemas que não conversam entre si.",
    },
    {
      type: "content",
      heading: "O custo que não aparece em nenhuma planilha",
      paragraphs: [
        "Esse custo raramente aparece em uma linha de orçamento, mas está presente todos os dias: tempo gasto exportando e cruzando planilhas manualmente, decisões tomadas com informação desatualizada, e a sensação constante de que ninguém tem a visão completa da operação em tempo real.",
        "Quando cada área da empresa enxerga apenas o seu pedaço do processo, erros de comunicação e retrabalho deixam de ser exceção e passam a ser rotina — um pedido fechado no CRM que demora para aparecer no financeiro, um cliente que reclama de algo que o time de atendimento não sabia que tinha acontecido.",
      ],
    },
    {
      type: "content",
      heading: "Sinais de desintegração",
      paragraphs: [
        "Alguns sinais indicam que os sistemas da empresa não estão conversando o suficiente:",
      ],
      bullets: [
        "A equipe exporta planilhas de um sistema para importar manualmente em outro",
        "Relatórios executivos exigem consolidação manual de múltiplas fontes",
        "Times diferentes têm números diferentes para a mesma métrica",
        "Uma mudança em um sistema não reflete automaticamente nos outros",
      ],
    },
    {
      type: "divider",
      number: "02",
      title: "O que muda com integração de verdade",
      intro: "Da convergência de dados a decisões mais rápidas e confiáveis.",
    },
    {
      type: "content",
      heading: "Um único painel, todos os dados",
      paragraphs: [
        "A alternativa é tratar integração como parte estrutural do sistema, não como um recurso adicional. Isso significa conectar CRM, ERP, financeiro, atendimento e qualquer outra ferramenta relevante em um único ambiente — com os dados convergindo automaticamente para painéis que refletem a operação real, no momento em que ela acontece.",
      ],
      bullets: [
        "Decisões executivas baseadas em dados atualizados, não em planilhas de dias atrás",
        "Menos retrabalho entre times, com informação fluindo automaticamente entre setores",
        "Visão única da operação, do comercial ao financeiro, em um só lugar",
        "Base pronta para automações e agentes de IA atuarem com contexto completo",
      ],
    },
    {
      type: "stat",
      heading: "O impacto de integrar de verdade",
      items: [
        {
          value: "1",
          label: "Fonte única de verdade para toda a operação, sem divergência entre times",
        },
        { value: "0", label: "Exportações manuais de planilha entre sistemas diferentes" },
        { value: "tempo real", label: "Atualização dos dados entre CRM, ERP e financeiro" },
      ],
    },
    {
      type: "divider",
      number: "03",
      title: "Arquitetura: APIs, webhooks e sincronização",
      intro: "Os mecanismos técnicos que sustentam uma integração confiável.",
    },
    {
      type: "content",
      heading: "As três formas de integrar sistemas",
      paragraphs: [
        "Existem diferentes formas de conectar sistemas, e a escolha certa depende da criticidade e do volume de dados envolvidos. Entender essas opções ajuda a avaliar propostas técnicas com mais segurança.",
      ],
      bullets: [
        "APIs REST: comunicação sob demanda entre sistemas, ideal para consultas e ações pontuais",
        "Webhooks: notificações automáticas quando algo muda em um sistema, sem precisar consultar repetidamente",
        "Sincronização em lote: atualização periódica de grandes volumes de dados, útil para relatórios históricos",
      ],
    },
    {
      type: "content",
      heading: "Consistência e resiliência",
      paragraphs: [
        "Uma boa arquitetura de integração não apenas conecta sistemas — ela lida bem com falhas. Se uma ferramenta fica temporariamente indisponível, os dados não podem simplesmente se perder; é preciso ter mecanismos de reenvio e conferência.",
        "Esse cuidado é o que separa uma integração superficial, que quebra na primeira instabilidade, de uma arquitetura de dados que realmente sustenta a operação no longo prazo.",
      ],
    },
    {
      type: "divider",
      number: "04",
      title: "Como priorizar o que integrar primeiro",
      intro: "Nem toda integração tem o mesmo impacto — comece pela que resolve mais dor.",
    },
    {
      type: "content",
      heading: "Priorize pelo impacto, não pela facilidade",
      paragraphs: [
        "É tentador começar pela integração mais simples de implementar. Mas o caminho mais eficiente é priorizar pelo impacto: qual conexão entre sistemas, se resolvida, elimina mais retrabalho ou reduz mais risco de erro na operação hoje.",
      ],
    },
    {
      type: "checklist",
      heading: "Checklist de priorização de integrações",
      intro: "Use esta lista para identificar por onde começar.",
      items: [
        "Identificamos quais dados são exportados e importados manualmente com mais frequência",
        "Sabemos qual integração, se resolvida, elimina mais retrabalho hoje",
        "Avaliamos o volume de dados e a criticidade de cada integração candidata",
        "Definimos o que acontece se uma integração falhar temporariamente",
        "Priorizamos integrações que impactam decisões executivas primeiro",
      ],
    },
    {
      type: "divider",
      number: "05",
      title: "Integração como base para IA",
      intro: "Por que sistemas integrados são pré-requisito para qualquer automação inteligente.",
    },
    {
      type: "content",
      heading: "Sem integração, não há contexto",
      paragraphs: [
        'Um agente de IA só consegue agir com inteligência se tiver acesso ao contexto completo da operação. Um sistema de atendimento integrado ao CRM e ao financeiro permite que a IA responda perguntas como "esse pedido já foi pago?" sem depender de um humano consultando três telas diferentes.',
        "Por isso, empresas que já investiram em integração de sistemas estão em vantagem real na hora de adotar IA: a base de dados já está pronta para ser consultada e usada por agentes automatizados.",
      ],
    },
    {
      type: "content",
      heading: "Conclusão",
      paragraphs: [
        "Integração de sistemas não é um projeto de tecnologia isolado — é a fundação sobre a qual decisões melhores, operações mais eficientes e automações inteligentes conseguem existir. Quem integra bem decide melhor. E quem decide melhor, cresce mais rápido.",
        "Se a sua empresa ainda depende de planilhas para conectar sistemas que deveriam conversar sozinhos, esse é o ponto de partida mais estratégico para qualquer transformação digital.",
      ],
    },
    {
      type: "closing",
      heading: "Quer seus sistemas conversando de verdade?",
      text: "Fale com a equipe da Brusync e veja como integrar CRM, ERP, financeiro e atendimento em um único fluxo de dados.",
    },
  ],
};
