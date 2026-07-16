import type { PdfDocumentData } from "../types";

export const iaEbook: PdfDocumentData = {
  slug: "inteligencia-artificial-aplicada-aos-negocios",
  title: "Inteligência Artificial aplicada aos negócios",
  subtitle: "Como sair do discurso e colocar IA para operar de verdade dentro da sua empresa.",
  category: "eBook",
  blocks: [
    {
      type: "cover",
      category: "eBook · Brusync",
      title: "Inteligência Artificial aplicada aos negócios",
      subtitle:
        "Como sair do discurso e colocar a IA para operar de verdade dentro da sua empresa — com dados próprios e resultado mensurável.",
    },
    {
      type: "toc",
      entries: [
        { title: "Introdução", page: 1 },
        { title: "01 · Por que 2026 é o ano da IA aplicada", page: 2 },
        { title: "02 · De ferramenta de apoio a agente de execução", page: 6 },
        { title: "03 · Onde a IA gera valor real", page: 10 },
        { title: "04 · A base necessária: dados e sistema próprio", page: 14 },
        { title: "05 · Como implementar sem virar um projeto de laboratório", page: 18 },
        { title: "06 · Governança, riscos e uso responsável", page: 22 },
        { title: "07 · O futuro: agentes autônomos no seu sistema", page: 25 },
        { title: "Conclusão", page: 28 },
      ],
    },
    {
      type: "content",
      heading: "Introdução",
      paragraphs: [
        "Poucos temas geraram tanto discurso e tão pouca aplicação prática quanto Inteligência Artificial nos últimos anos. Enquanto grandes empresas de tecnologia anunciavam recursos cada vez mais sofisticados, a maioria das empresas médias via a IA como algo distante da sua realidade operacional.",
        "Esse cenário mudou. Este eBook mostra como colocar IA para funcionar dentro da sua operação de verdade — não como uma funcionalidade isolada, mas como parte da arquitetura do seu sistema, conectada aos seus dados e às suas regras de negócio.",
      ],
    },
    {
      type: "divider",
      number: "01",
      title: "Por que 2026 é o ano da IA aplicada",
      intro: "A diferença entre o hype dos últimos anos e a maturidade que chegou agora.",
    },
    {
      type: "content",
      heading: "Do projeto piloto à operação real",
      paragraphs: [
        "Até pouco tempo, adotar IA em uma empresa média significava um projeto piloto isolado, um relatório bonito e pouca aplicação prática no dia a dia. Os modelos existiam, mas faltava a peça que conectava tudo: acesso estruturado aos dados reais da operação.",
        "Isso mudou porque a infraestrutura amadureceu dos dois lados. Os modelos de linguagem ficaram mais confiáveis e acessíveis, e as empresas passaram a ter sistemas capazes de organizar seus dados de forma que uma IA consiga efetivamente consultá-los e agir sobre eles.",
      ],
    },
    {
      type: "content",
      heading: "O que realmente mudou",
      paragraphs: [
        "Três fatores explicam por que a aplicação prática de IA deixou de ser exceção:",
      ],
      bullets: [
        "Custo de acesso a modelos de linguagem caiu significativamente nos últimos anos",
        "Ferramentas de integração tornaram viável conectar IA a sistemas internos com segurança",
        "Empresas passaram a organizar dados que antes viviam espalhados em planilhas e ferramentas soltas",
      ],
    },
    {
      type: "stat",
      heading: "O tamanho da mudança",
      items: [
        {
          value: "24/7",
          label: "Capacidade de atendimento e triagem, sem depender de escala humana",
        },
        {
          value: "0",
          label: "Tempo de espera para consultar dados que antes exigiam relatórios manuais",
        },
        {
          value: "1",
          label: "Sistema único capaz de dar contexto completo para qualquer agente de IA",
        },
      ],
    },
    {
      type: "divider",
      number: "02",
      title: "De ferramenta de apoio a agente de execução",
      intro: "Como a IA deixou de sugerir e passou a agir dentro dos processos da empresa.",
    },
    {
      type: "content",
      heading: "A diferença entre sugerir e executar",
      paragraphs: [
        "A primeira geração de uso corporativo de IA era essencialmente consultiva: a ferramenta gerava uma sugestão, e um humano decidia o que fazer com ela. Hoje, agentes de IA bem integrados conseguem consultar bases de dados, cruzar informações de diferentes áreas e executar ações dentro de regras de negócio bem definidas.",
        "Essa mudança de papel — de assistente a executor — só é segura quando a IA está conectada a um sistema que a empresa realmente controla. Agentes plugados em ferramentas genéricas de terceiros esbarram em limites de acesso, permissões engessadas e dados fragmentados.",
      ],
    },
    {
      type: "content",
      heading: "Exemplos de execução autônoma",
      paragraphs: [
        "Alguns exemplos de tarefas que agentes de IA já executam de ponta a ponta, sem intervenção humana constante:",
      ],
      bullets: [
        "Qualificar um lead e movê-lo para a etapa correta do funil comercial",
        "Responder dúvidas frequentes de clientes em múltiplos canais simultaneamente",
        "Gerar relatórios executivos sob demanda, cruzando dados de diferentes áreas",
        "Identificar variações relevantes em métricas e alertar a pessoa responsável",
      ],
    },
    {
      type: "flow",
      heading: "Como um agente de execução opera na prática",
      steps: [
        "Recebe um gatilho — uma mensagem, um evento ou uma pergunta",
        "Consulta os dados relevantes diretamente no sistema da empresa",
        "Aplica as regras de negócio definidas para aquele tipo de situação",
        "Executa a ação ou gera uma resposta dentro dos limites configurados",
        "Registra o que foi feito para auditoria e aprendizado contínuo",
      ],
    },
    {
      type: "divider",
      number: "03",
      title: "Onde a IA gera valor real",
      intro: "As áreas onde a aplicação de IA já mostra retorno mensurável hoje.",
    },
    {
      type: "content",
      heading: "Atendimento e vendas",
      paragraphs: [
        "No atendimento, a IA reduz drasticamente o tempo de primeira resposta e consegue resolver sozinha uma parcela relevante das dúvidas recorrentes, liberando a equipe humana para os casos que realmente exigem julgamento.",
        "No comercial, agentes de IA resumem conversas inteiras em segundos, sugerem o próximo passo com cada lead e garantem que nenhuma oportunidade esfrie por falta de follow-up.",
      ],
    },
    {
      type: "content",
      heading: "Operações e dados",
      paragraphs: [
        "Em operações, a IA cruza informações de estoque, pedidos e fornecedores para antecipar rupturas antes que aconteçam. Em times de dados e financeiro, ela transforma perguntas em linguagem natural em relatórios prontos, sem depender de uma fila de solicitações para a equipe de BI.",
      ],
      bullets: [
        "Atendimento: triagem automática e respostas instantâneas em múltiplos canais",
        "Vendas: resumo de conversas e priorização automática de leads quentes",
        "Operações: previsão de ruptura de estoque e otimização de compras",
        "Financeiro: geração de relatórios sob demanda a partir de dados em tempo real",
      ],
    },
    {
      type: "checklist",
      heading: "Onde começar: um checklist de priorização",
      intro:
        "Antes de implementar IA em toda a operação, priorize onde o impacto será mais rápido de medir.",
      items: [
        "Escolhemos um processo específico e mensurável para o primeiro projeto de IA",
        "Sabemos qual métrica vai indicar se o projeto está funcionando",
        "O processo escolhido já tem dados organizados e acessíveis",
        "Definimos limites claros do que a IA pode decidir sozinha",
        "Temos alguém responsável por acompanhar os resultados nas primeiras semanas",
      ],
    },
    {
      type: "divider",
      number: "04",
      title: "A base necessária: dados e sistema próprio",
      intro: "Por que a IA só entrega valor real quando está conectada a dados organizados.",
    },
    {
      type: "content",
      heading: "Sem dados organizados, não há IA útil",
      paragraphs: [
        "A maior causa de frustração com projetos de IA não é a qualidade dos modelos — é a qualidade dos dados que eles conseguem acessar. Uma IA conectada a informações fragmentadas em planilhas, sistemas desconectados e processos manuais produz respostas tão inconsistentes quanto os dados de origem.",
        "Por isso, o pré-requisito real para IA aplicada não é um modelo mais avançado: é um sistema que centraliza os dados da operação de forma estruturada e acessível — exatamente o que um software próprio, integrado, entrega por padrão.",
      ],
    },
    {
      type: "content",
      heading: "O papel do sistema próprio",
      paragraphs: [
        "Um sistema próprio, ao contrário de ferramentas genéricas conectadas por integrações limitadas, oferece:",
      ],
      bullets: [
        "Acesso direto e seguro aos dados, sem depender de exportações manuais",
        "Contexto completo da operação, cruzando áreas diferentes automaticamente",
        "Controle total sobre o que a IA pode ou não acessar e executar",
        "Capacidade de evoluir os agentes conforme o negócio muda, sem depender de terceiros",
      ],
    },
    {
      type: "divider",
      number: "05",
      title: "Como implementar sem virar um projeto de laboratório",
      intro: "Um caminho prático para sair da teoria e gerar resultado em semanas, não em anos.",
    },
    {
      type: "content",
      heading: "Comece pequeno, meça sempre",
      paragraphs: [
        "Projetos de IA que nunca saem do papel costumam ter um traço em comum: tentam resolver tudo de uma vez. O caminho mais confiável é o oposto — escolher um processo específico, com impacto mensurável, e expandir a partir dos resultados reais.",
        "Isso significa resistir à tentação de esperar por uma solução perfeita antes de começar. Um agente de IA respondendo 60% das dúvidas de atendimento hoje já gera valor mensurável, mesmo que ainda não resolva os outros 40%.",
      ],
    },
    {
      type: "content",
      heading: "Um roteiro de implementação",
      paragraphs: ["Um caminho testado para levar IA da teoria à prática em poucas semanas:"],
      bullets: [
        "Escolha um processo específico com dados já disponíveis",
        "Defina a métrica de sucesso antes de implementar, não depois",
        "Implemente com limites claros do que a IA pode decidir sozinha",
        "Acompanhe os resultados nas primeiras semanas com atenção redobrada",
        "Expanda para novos processos a partir do que funcionou",
      ],
    },
    {
      type: "quote",
      text: "A IA não substitui um sistema mal estruturado. Ela amplifica o que já existe — para o bem ou para o mal.",
      author: "Princípio central de qualquer projeto de IA aplicada",
    },
    {
      type: "divider",
      number: "06",
      title: "Governança, riscos e uso responsável",
      intro: "O que toda empresa precisa decidir antes de dar autonomia a um agente de IA.",
    },
    {
      type: "content",
      heading: "Autonomia com limites claros",
      paragraphs: [
        "Dar autonomia a um agente de IA não significa abrir mão de controle — significa definir, com precisão, o que ele pode decidir sozinho e o que precisa de validação humana. Essa fronteira deve ser revisada conforme a confiança no sistema aumenta.",
        "Questões como privacidade de dados, transparência sobre quando o cliente está conversando com uma IA, e auditoria das decisões tomadas automaticamente fazem parte de qualquer implementação responsável — não são detalhes opcionais.",
      ],
      bullets: [
        "Defina claramente quais decisões exigem validação humana",
        "Garanta que o cliente saiba quando está interagindo com uma IA",
        "Registre e audite as ações executadas automaticamente",
        "Revise periodicamente os limites de autonomia conforme os resultados",
      ],
    },
    {
      type: "divider",
      number: "07",
      title: "O futuro: agentes autônomos no seu sistema",
      intro: "Para onde essa tecnologia caminha nos próximos anos — e como se preparar.",
    },
    {
      type: "content",
      heading: "De módulo a parte da arquitetura",
      paragraphs: [
        "A tendência para os próximos anos é clara: empresas que tratam a IA como parte da arquitetura do próprio sistema — e não como um plugin externo — vão operar com uma eficiência que concorrentes presos a ferramentas genéricas simplesmente não conseguem alcançar.",
        "Ter um sistema próprio deixou de ser luxo: é o que garante espaço para essa evolução acontecer no seu ritmo, com seus dados e sob seu controle — sem depender do roadmap de outra empresa para decidir até onde a sua IA pode ir.",
      ],
    },
    {
      type: "content",
      heading: "Conclusão",
      paragraphs: [
        "IA aplicada não é sobre adotar a ferramenta mais avançada do mercado — é sobre ter a base certa para que qualquer ferramenta funcione de verdade. Dados organizados, sistema próprio e um processo bem definido valem mais do que o modelo mais sofisticado disponível.",
        "Se a sua empresa já sente que os dados estão espalhados demais para tirar proveito real de IA, esse é o primeiro problema a resolver — e o ponto de partida de qualquer projeto que realmente funcione.",
      ],
    },
    {
      type: "closing",
      heading: "Quer IA operando de verdade na sua empresa?",
      text: "Fale com a equipe da Brusync e veja como conectar agentes de IA a um sistema pensado para a sua operação.",
    },
  ],
};
