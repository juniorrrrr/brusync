import type { PdfDocumentData } from "../types";

export const escolherSoftwareChecklist: PdfDocumentData = {
  slug: "checklist-como-escolher-software-personalizado",
  title: "Como escolher um software personalizado",
  subtitle:
    "Os critérios que realmente importam na hora de decidir entre alugar uma plataforma pronta ou investir em um sistema próprio.",
  category: "Checklist",
  blocks: [
    {
      type: "cover",
      category: "Checklist · Brusync",
      title: "Como escolher um software personalizado",
      subtitle:
        "Os critérios que realmente importam na hora de decidir entre alugar uma plataforma pronta ou investir em um sistema próprio.",
    },
    {
      type: "toc",
      entries: [
        { title: "Introdução", page: 1 },
        { title: "01 · Antes de escolher: entenda o problema real", page: 2 },
        { title: "02 · Critérios técnicos essenciais", page: 4 },
        { title: "03 · Critérios de parceria e confiança", page: 6 },
        { title: "04 · Perguntas para a reunião comercial", page: 8 },
        { title: "05 · Red flags: quando fugir de uma proposta", page: 10 },
      ],
    },
    {
      type: "content",
      heading: "Introdução",
      paragraphs: [
        "Escolher entre uma plataforma pronta e um sistema desenvolvido sob medida é uma das decisões mais estratégicas — e mais confusas — para quem lidera uma empresa em crescimento. As propostas do mercado costumam soar parecidas, mas as diferenças reais só aparecem meses depois da assinatura do contrato.",
        "Este checklist reúne os critérios que realmente separam uma boa escolha de um arrependimento caro, organizados para serem usados durante o processo de avaliação de fornecedores.",
      ],
    },
    {
      type: "divider",
      number: "01",
      title: "Antes de escolher: entenda o problema real",
      intro: "Nenhum critério de escolha funciona sem clareza sobre o que precisa ser resolvido.",
    },
    {
      type: "checklist",
      heading: "Entenda o problema antes de comparar propostas",
      items: [
        "Sabemos exatamente qual processo o novo sistema precisa resolver",
        "Entendemos por que as ferramentas atuais não resolvem esse problema",
        "Sabemos quais times vão usar o sistema no dia a dia",
        "Definimos o que significaria sucesso seis meses após a implementação",
        "Temos clareza sobre o orçamento disponível para essa decisão",
      ],
    },
    {
      type: "divider",
      number: "02",
      title: "Critérios técnicos essenciais",
      intro: "O que avaliar tecnicamente antes de fechar qualquer proposta.",
    },
    {
      type: "checklist",
      heading: "Critérios técnicos essenciais",
      items: [
        "O sistema pode ser adaptado às regras de negócio específicas da empresa",
        "Está claro quem é o dono dos dados gerados pelo sistema",
        "O sistema se integra com as ferramentas que a empresa já usa",
        "Existe um plano claro de backup e segurança dos dados",
        "A performance do sistema foi validada para o volume de uso da empresa",
      ],
    },
    {
      type: "divider",
      number: "03",
      title: "Critérios de parceria e confiança",
      intro: "Tecnologia é só metade da decisão — a outra metade é quem vai construir com você.",
    },
    {
      type: "checklist",
      heading: "Critérios de parceria e confiança",
      items: [
        "O fornecedor já entregou projetos semelhantes ao nosso porte e segmento",
        "Existe transparência sobre prazos, custos e possíveis riscos do projeto",
        "O processo de comunicação durante o desenvolvimento está claro",
        "Sabemos como funciona o suporte após o sistema entrar em produção",
        "Conseguimos falar com alguém que já é cliente desse fornecedor",
      ],
    },
    {
      type: "divider",
      number: "04",
      title: "Perguntas para a reunião comercial",
      intro: "As perguntas que revelam mais sobre um fornecedor do que qualquer apresentação.",
    },
    {
      type: "checklist",
      heading: "Perguntas para fazer na reunião comercial",
      items: [
        "Quem é o dono do código e dos dados ao final do projeto?",
        "O que acontece se quisermos trocar de fornecedor no futuro?",
        "Como vocês lidam com mudanças de escopo durante o desenvolvimento?",
        "Qual é o processo de suporte e correção de problemas após o lançamento?",
        "Como o sistema evolui conforme a nossa empresa cresce?",
      ],
    },
    {
      type: "divider",
      number: "05",
      title: "Red flags: quando fugir de uma proposta",
      intro: "Sinais de alerta que indicam que vale a pena buscar outra opção.",
    },
    {
      type: "checklist",
      heading: "Sinais de alerta em uma proposta",
      items: [
        "A proposta não deixa claro quem é o dono dos dados e do código",
        "O fornecedor evita explicar como funciona o suporte pós-lançamento",
        "Não existem exemplos verificáveis de projetos anteriores semelhantes",
        "O prazo apresentado parece curto demais para o escopo descrito",
        "Falta clareza sobre custos além da mensalidade ou taxa inicial",
      ],
    },
    {
      type: "quote",
      text: "A pergunta certa não é qual software é mais barato hoje — é qual decisão a sua empresa vai lamentar menos daqui a três anos.",
      author: "Princípio central de qualquer decisão de tecnologia",
    },
    {
      type: "closing",
      heading: "Quer ajuda para tomar essa decisão?",
      text: "Fale com a equipe da Brusync e entenda se um sistema sob medida faz sentido para o momento da sua empresa.",
    },
  ],
};
