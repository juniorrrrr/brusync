import type { PdfDocumentData } from "../types";

export const whitelabelEbook: PdfDocumentData = {
  slug: "como-criar-software-white-label",
  title: "Como criar um software White Label para sua empresa",
  subtitle: "Um guia completo para sair do software genérico e construir uma plataforma própria.",
  category: "eBook",
  blocks: [
    {
      type: "cover",
      category: "eBook · Brusync",
      title: "Como criar um software White Label para sua empresa",
      subtitle:
        "Um guia completo para sair do software genérico e construir uma plataforma própria — com sua marca, seu domínio e suas regras de negócio.",
    },
    {
      type: "toc",
      entries: [
        { title: "Introdução", page: 1 },
        { title: "01 · O problema do software genérico", page: 2 },
        { title: "02 · O que é, de fato, um White Label", page: 5 },
        { title: "03 · Os 5 pilares da propriedade digital", page: 8 },
        { title: "04 · Planejamento: por onde começar", page: 11 },
        { title: "05 · Arquitetura de um sistema sob medida", page: 14 },
        { title: "06 · O processo, do zero ao lançamento", page: 17 },
        { title: "07 · Time e parceiro de tecnologia", page: 20 },
        { title: "08 · Erros comuns ao migrar", page: 23 },
        { title: "Conclusão", page: 26 },
      ],
    },
    {
      type: "content",
      heading: "Introdução",
      paragraphs: [
        "Toda empresa que cresce o suficiente chega a um mesmo momento: o software que resolvia tudo no início começa a travar a operação. Faltam funcionalidades, sobram mensalidades, e a marca do fornecedor aparece em cada tela — inclusive nas que seus clientes usam.",
        "Este eBook é um guia prático para quem está avaliando sair de plataformas genéricas e construir um sistema próprio, White Label, sob medida para a forma como o seu negócio realmente opera. Vamos cobrir desde o motivo pelo qual isso importa até os erros mais comuns nessa transição.",
      ],
    },
    {
      type: "divider",
      number: "01",
      title: "O problema do software genérico",
      intro: "Por que ferramentas prontas resolvem no começo e travam o crescimento depois.",
    },
    {
      type: "content",
      heading: "O custo invisível de alugar tecnologia",
      paragraphs: [
        "Softwares genéricos são construídos para atender milhares de empresas ao mesmo tempo — o que significa que nenhuma delas recebe um sistema pensado especificamente para sua operação. O resultado é sempre parecido: telas que sobram, funcionalidades que faltam, e uma mensalidade que cresce junto com o número de usuários, não com o valor entregue.",
        "Esse custo raramente aparece como uma linha isolada no orçamento. Ele se manifesta em tempo perdido com planilhas paralelas, processos manuais para compensar o que o software não faz, e uma dependência constante do roadmap de outra empresa para decidir o que a sua pode ou não fazer.",
      ],
    },
    {
      type: "content",
      heading: "Sinais de que sua empresa precisa de algo próprio",
      paragraphs: [
        "Alguns sinais costumam aparecer antes de a decisão ficar óbvia. Vale revisar se algum deles soa familiar:",
      ],
      bullets: [
        "A equipe usa planilhas paralelas para compensar o que o sistema atual não faz",
        "Cada nova integração exige um plano superior ou um addon pago à parte",
        "A marca do fornecedor aparece em telas que o seu cliente final também vê",
        "O time de produto do fornecedor não prioriza as suas necessidades específicas",
        "O custo por usuário cresce mais rápido do que o valor percebido pela equipe",
      ],
    },
    {
      type: "divider",
      number: "02",
      title: "O que é, de fato, um White Label",
      intro:
        "Entenda o conceito além do termo — e por que ele muda a relação da empresa com a tecnologia.",
    },
    {
      type: "content",
      heading: "Mais do que uma marca personalizada",
      paragraphs: [
        "É comum associar White Label apenas à troca de um logotipo. Mas um software White Label de verdade vai muito além disso: é um sistema desenvolvido especificamente para uma empresa, que passa a ser proprietária do código, dos dados e da infraestrutura — não apenas de uma camada visual sobre uma ferramenta de terceiros.",
        'A diferença é estrutural. Em uma plataforma genérica com "personalização", o cliente aluga acesso a um produto que continua sendo de outra empresa. Em um sistema White Label construído sob medida, o cliente passa a possuir um ativo digital próprio — que pode evoluir, ser vendido, ou se tornar parte do valor de mercado do negócio.',
      ],
    },
    {
      type: "content",
      heading: "White Label não é personalização superficial",
      paragraphs: ["Para diferenciar as duas abordagens na prática:"],
      bullets: [
        "Personalização superficial: troca de cores e logo dentro de um produto que continua sendo de terceiros",
        "White Label real: sistema próprio, com banco de dados, domínio e tecnologia exclusivos da empresa",
        "Personalização superficial: limites de funcionalidade definidos pelo plano contratado",
        "White Label real: funcionalidades desenhadas para o processo real do negócio, sem limites artificiais",
      ],
    },
    {
      type: "divider",
      number: "03",
      title: "Os 5 pilares da propriedade digital",
      intro: "O que muda, na prática, quando uma empresa passa a possuir o próprio sistema.",
    },
    {
      type: "content",
      heading: "Sistema, domínio, marca, dados e tecnologia",
      paragraphs: [
        'Um projeto White Label bem construído se apoia em cinco pilares. Juntos, eles definem o que significa "possuir" um sistema, em vez de apenas usá-lo.',
      ],
      bullets: [
        "Sistema próprio: o código e a lógica de negócio pertencem à empresa, não a um terceiro",
        "Domínio próprio: o sistema roda no domínio da empresa, reforçando a marca em cada acesso",
        "Identidade visual própria: nenhum resquício do fornecedor aparece para o cliente final",
        "Banco de dados próprio: os dados da operação não dependem da política de retenção de outra empresa",
        "Tecnologia própria: a stack pode evoluir conforme a necessidade do negócio, não conforme o roadmap alheio",
      ],
    },
    {
      type: "stat",
      heading: "Por que isso importa financeiramente",
      items: [
        {
          value: "0",
          label: "Mensalidades por usuário — o sistema é um ativo, não uma assinatura",
        },
        {
          value: "100%",
          label: "Dos dados gerados pela operação permanecem sob controle da empresa",
        },
        {
          value: "∞",
          label: "Capacidade de evolução, sem depender do plano ou do roadmap de terceiros",
        },
      ],
    },
    {
      type: "divider",
      number: "04",
      title: "Planejamento: por onde começar",
      intro: "As perguntas certas antes de iniciar qualquer desenvolvimento.",
    },
    {
      type: "content",
      heading: "Mapeie antes de construir",
      paragraphs: [
        "O maior erro em projetos de software sob medida é começar pelo desenvolvimento. Antes de qualquer linha de código, vale mapear com clareza os processos que o sistema precisa suportar, os dados que ele vai centralizar e os times que vão utilizá-lo no dia a dia.",
        "Esse mapeamento não precisa ser um documento de centenas de páginas — mas precisa ser honesto sobre como a operação realmente funciona hoje, incluindo os processos informais que raramente aparecem em um manual.",
      ],
    },
    {
      type: "checklist",
      heading: "Checklist de planejamento inicial",
      intro:
        "Use esta lista como ponto de partida antes de conversar com um parceiro de tecnologia.",
      items: [
        "Mapeamos os principais processos que o sistema precisa suportar",
        "Identificamos quais ferramentas atuais precisam ser substituídas ou integradas",
        "Sabemos quais times vão usar o sistema no dia a dia",
        "Definimos quais dados são críticos e onde estão hoje",
        "Temos clareza sobre o orçamento e o prazo desejado para a primeira versão",
        "Escolhemos quem, internamente, será o responsável pelo projeto",
      ],
    },
    {
      type: "divider",
      number: "05",
      title: "Arquitetura de um sistema sob medida",
      intro: "As camadas técnicas que sustentam uma plataforma White Label robusta.",
    },
    {
      type: "content",
      heading: "As camadas de uma plataforma própria",
      paragraphs: [
        "Um sistema White Label bem arquitetado é construído em camadas independentes, o que permite evoluir cada parte sem comprometer o restante. Essa separação é o que garante que o sistema continue rápido e estável mesmo conforme a operação cresce.",
      ],
      bullets: [
        "Camada de dados: banco de dados próprio, com backups e políticas de acesso controladas pela empresa",
        "Camada de regras de negócio: lógica que reflete exatamente como a operação funciona",
        "Camada de interface: telas desenhadas para os fluxos reais de cada time",
        "Camada de integrações: conexões com ferramentas já usadas pela empresa (ERP, CRM, mídia paga)",
        "Camada de segurança: autenticação, permissões e criptografia adequadas ao porte do negócio",
      ],
    },
    {
      type: "divider",
      number: "06",
      title: "O processo, do zero ao lançamento",
      intro: "Como uma plataforma sob medida sai do papel até chegar à operação.",
    },
    {
      type: "content",
      heading: "Da descoberta à evolução contínua",
      paragraphs: [
        "Projetos de software sob medida seguem um fluxo previsível quando bem conduzidos. Conhecer essas etapas ajuda a definir expectativas realistas de prazo e a identificar se um parceiro de tecnologia está seguindo um processo maduro.",
      ],
    },
    {
      type: "flow",
      heading: "As 6 etapas de um projeto White Label",
      steps: [
        "Descoberta — mapeamento de processos, dados e times envolvidos",
        "Design — desenho das telas e fluxos com base na operação real",
        "Desenvolvimento — construção do sistema em ciclos incrementais",
        "Testes — validação com usuários reais antes do lançamento",
        "Lançamento — implantação com a marca e o domínio da empresa",
        "Evolução contínua — novas funcionalidades a partir do uso real",
      ],
    },
    {
      type: "divider",
      number: "07",
      title: "Time e parceiro de tecnologia",
      intro: "Como estruturar internamente o projeto e o que avaliar em um parceiro externo.",
    },
    {
      type: "content",
      heading: "Quem precisa estar envolvido",
      paragraphs: [
        "Mesmo terceirizando o desenvolvimento, todo projeto White Label bem-sucedido tem um responsável interno claro — alguém que conhece a operação a fundo e consegue validar decisões rapidamente. Sem isso, o projeto perde velocidade esperando aprovações.",
        "Do lado do parceiro de tecnologia, vale avaliar não apenas a capacidade técnica, mas a experiência em conduzir esse tipo de projeto do início ao fim: descoberta, arquitetura, entrega e suporte pós-lançamento.",
      ],
    },
    {
      type: "content",
      heading: "O que perguntar a um parceiro de tecnologia",
      paragraphs: ["Algumas perguntas ajudam a separar um parceiro maduro de uma promessa vaga:"],
      bullets: [
        "Quem é o dono do código e dos dados ao final do projeto?",
        "Como funciona o suporte e a evolução após o lançamento?",
        "Existe algum tipo de dependência de plataforma de terceiros embutida na solução?",
        "Como são conduzidas as integrações com sistemas que já usamos?",
      ],
    },
    {
      type: "divider",
      number: "08",
      title: "Erros comuns ao migrar (e como evitar)",
      intro: "O que costuma dar errado em projetos de migração — e como se antecipar.",
    },
    {
      type: "content",
      heading: "Os erros mais frequentes",
      paragraphs: [
        "A maioria dos problemas em migrações para sistema próprio se repete entre empresas diferentes:",
      ],
      bullets: [
        "Tentar migrar tudo de uma vez, em vez de priorizar os processos mais críticos primeiro",
        "Não envolver os times que vão usar o sistema no dia a dia durante o desenho das telas",
        "Subestimar o tempo necessário para migração e limpeza dos dados históricos",
        "Escolher um parceiro pelo preço, sem avaliar a experiência em projetos semelhantes",
        "Não planejar o suporte e a evolução do sistema após o lançamento",
      ],
    },
    {
      type: "chart",
      heading: "Custo total em 3 anos: SaaS genérico x sistema próprio",
      caption:
        "Estimativa ilustrativa considerando uma operação de médio porte com crescimento de equipe ao longo do período.",
      bars: [
        { label: "Ano 1", value: 38 },
        { label: "Ano 2 (SaaS)", value: 64 },
        { label: "Ano 2 (próprio)", value: 30 },
        { label: "Ano 3 (SaaS)", value: 92 },
        { label: "Ano 3 (próprio)", value: 34 },
      ],
    },
    {
      type: "content",
      heading: "Conclusão",
      paragraphs: [
        "Migrar para um sistema White Label não é apenas uma decisão técnica — é uma decisão estratégica sobre o quanto a sua empresa quer depender de plataformas de terceiros para operar. Feita com planejamento, essa transição transforma tecnologia de despesa recorrente em ativo digital próprio.",
        "Se este guia ajudou a organizar as ideias, o próximo passo natural é conversar com um time que já conduziu esse processo do início ao fim — da descoberta ao suporte contínuo depois do lançamento.",
      ],
    },
    {
      type: "closing",
      heading: "Pronto para ter um sistema que é seu?",
      text: "Fale com a equipe da Brusync e veja como fica uma plataforma White Label desenhada para a sua operação.",
    },
  ],
};
