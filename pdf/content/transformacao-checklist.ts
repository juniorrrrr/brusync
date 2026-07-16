import type { PdfDocumentData } from "../types";

export const transformacaoChecklist: PdfDocumentData = {
  slug: "checklist-transformacao-digital-empresarial",
  title: "Transformação Digital Empresarial",
  subtitle:
    "Um checklist prático para mapear o quanto a sua operação ainda depende de planilhas e processos manuais.",
  category: "Checklist",
  blocks: [
    {
      type: "cover",
      category: "Checklist · Brusync",
      title: "Transformação Digital Empresarial",
      subtitle:
        "Um checklist prático para mapear o quanto a sua operação ainda depende de planilhas e processos manuais — e por onde começar a resolver isso.",
    },
    {
      type: "toc",
      entries: [
        { title: "Introdução", page: 1 },
        { title: "Como usar este checklist", page: 2 },
        { title: "01 · Diagnóstico da operação atual", page: 3 },
        { title: "02 · Processos e dados", page: 5 },
        { title: "03 · Ferramentas e integrações", page: 7 },
        { title: "04 · Pessoas e cultura digital", page: 9 },
        { title: "05 · Segurança e conformidade (LGPD)", page: 11 },
        { title: "06 · Plano de ação e prioridades", page: 13 },
      ],
    },
    {
      type: "content",
      heading: "Introdução",
      paragraphs: [
        "Transformação digital virou um termo tão usado que perdeu parte do significado prático. Este checklist tem um objetivo direto: ajudar a sua empresa a identificar, com clareza, onde a operação ainda depende de processos manuais, planilhas paralelas e ferramentas desconectadas.",
        "Não é uma lista teórica. Cada item foi pensado para ser respondido com sim ou não, gerando um retrato honesto de onde a digitalização já avançou e onde ainda existe risco e retrabalho escondidos na rotina.",
      ],
    },
    {
      type: "content",
      heading: "Como usar este checklist",
      paragraphs: [
        "Percorra as seis seções na ordem sugerida, marcando os itens que já são verdade na sua operação hoje. Seções com muitos itens não marcados indicam onde priorizar os próximos passos da transformação digital.",
        "Recomendamos revisitar este checklist a cada seis meses — a maturidade digital de uma empresa muda rápido, e o que era prioridade hoje pode já estar resolvido no próximo ciclo.",
      ],
    },
    {
      type: "divider",
      number: "01",
      title: "Diagnóstico da operação atual",
      intro:
        "Entenda com clareza onde a sua empresa está hoje antes de planejar os próximos passos.",
    },
    {
      type: "checklist",
      heading: "Diagnóstico da operação atual",
      items: [
        "Sabemos exatamente quais processos ainda dependem de planilhas",
        "Existe um mapa atualizado de quais ferramentas cada time utiliza",
        "Conseguimos medir quanto tempo é gasto em tarefas manuais repetitivas",
        "Sabemos onde os dados da operação estão fisicamente armazenados",
        "Existe clareza sobre quais decisões dependem de relatórios manuais",
      ],
    },
    {
      type: "divider",
      number: "02",
      title: "Processos e dados",
      intro: "A base de qualquer transformação digital real: processos claros e dados confiáveis.",
    },
    {
      type: "checklist",
      heading: "Processos e dados",
      items: [
        "Os principais processos da empresa estão documentados, mesmo que de forma simples",
        "Os dados gerados por diferentes áreas conseguem ser cruzados sem exportação manual",
        "Existe um responsável definido pela qualidade dos dados em cada área",
        "Sabemos identificar quando um dado está desatualizado ou incorreto",
        "Conseguimos gerar relatórios executivos sem depender de trabalho manual",
      ],
    },
    {
      type: "divider",
      number: "03",
      title: "Ferramentas e integrações",
      intro: "O quanto as ferramentas que a empresa já usa realmente conversam entre si.",
    },
    {
      type: "checklist",
      heading: "Ferramentas e integrações",
      items: [
        "As principais ferramentas da empresa trocam dados automaticamente entre si",
        "Não existe necessidade de copiar dados manualmente entre sistemas diferentes",
        "Sabemos quais integrações são críticas para a operação não parar",
        "Existe um plano para o que fazer se uma ferramenta atual for descontinuada",
        "As ferramentas atuais suportam o volume de dados da operação sem lentidão",
      ],
    },
    {
      type: "divider",
      number: "04",
      title: "Pessoas e cultura digital",
      intro: "Tecnologia sozinha não transforma nada sem as pessoas certas ao lado.",
    },
    {
      type: "checklist",
      heading: "Pessoas e cultura digital",
      items: [
        "A equipe se sente confortável reportando problemas nas ferramentas atuais",
        "Existe alguém, formal ou informalmente, responsável por decisões de tecnologia",
        "Novos processos digitais são comunicados com antecedência para toda a equipe",
        "A liderança usa os dados do sistema para tomar decisões, não apenas a intuição",
        "Existe espaço para a equipe sugerir melhorias nas ferramentas do dia a dia",
      ],
    },
    {
      type: "divider",
      number: "05",
      title: "Segurança e conformidade (LGPD)",
      intro: "Digitalizar sem cuidar da segurança dos dados cria risco, não eficiência.",
    },
    {
      type: "checklist",
      heading: "Segurança e conformidade (LGPD)",
      items: [
        "Sabemos quais dados pessoais a empresa coleta e onde ficam armazenados",
        "Existe uma política clara de quem pode acessar quais dados na empresa",
        "Os dados sensíveis da operação têm algum tipo de backup e proteção",
        "A empresa sabe como responderia a uma solicitação de exclusão de dados",
        "Sistemas críticos têm controle de acesso por usuário, não senhas compartilhadas",
      ],
    },
    {
      type: "divider",
      number: "06",
      title: "Plano de ação e prioridades",
      intro: "Transformar as respostas deste checklist em próximos passos concretos.",
    },
    {
      type: "checklist",
      heading: "Plano de ação e prioridades",
      items: [
        "Identificamos as três áreas com mais itens não marcados neste checklist",
        "Priorizamos qual área resolver primeiro com base em impacto e urgência",
        "Definimos um responsável para conduzir os próximos passos",
        "Estabelecemos um prazo realista para a primeira melhoria mensurável",
        "Agendamos revisar este checklist novamente em seis meses",
      ],
    },
    {
      type: "stat",
      heading: "O que empresas ganham ao digitalizar de verdade",
      items: [
        {
          value: "-40%",
          label:
            "Tempo médio gasto em tarefas manuais repetitivas, em empresas que integram seus sistemas",
        },
        {
          value: "1",
          label: "Fonte única de dados, eliminando divergências entre planilhas paralelas",
        },
        { value: "+", label: "Velocidade de decisão, com relatórios gerados automaticamente" },
      ],
    },
    {
      type: "closing",
      heading: "Pronto para digitalizar sua operação de verdade?",
      text: "Fale com a equipe da Brusync e veja como um sistema próprio elimina as planilhas paralelas da sua empresa.",
    },
  ],
};
