import { createEmptyBlock } from "@/domain/knowledge/blocks";
import type { KnowledgeBlock, KnowledgeTemplate } from "@/types/knowledge";

function heading(text: string): KnowledgeBlock {
  const block = createEmptyBlock("heading");
  block.data = { text };
  return block;
}

function paragraph(text: string): KnowledgeBlock {
  const block = createEmptyBlock("paragraph");
  block.data = { text };
  return block;
}

function checklist(items: string[]): KnowledgeBlock {
  const block = createEmptyBlock("checklist");
  block.data = { items: items.map((text) => ({ text, done: false })) };
  return block;
}

function list(items: string[]): KnowledgeBlock {
  const block = createEmptyBlock("list");
  block.data = { ordered: false, items };
  return block;
}

/** Starter skeletons offered by "Novo documento a partir de um modelo" — one
 * per template requested in the Fase 18 spec. Purely structural content
 * (headings + placeholder guidance), never real client data. */
export const KNOWLEDGE_TEMPLATES: KnowledgeTemplate[] = [
  {
    key: "proposta-comercial",
    name: "Proposta Comercial",
    description: "Estrutura padrão para propostas enviadas a clientes e leads.",
    contentType: "template",
    blocks: [
      heading("Proposta Comercial"),
      paragraph("Cliente: \nData de validade: \nResponsável: "),
      heading("Escopo"),
      paragraph("Descreva o escopo do projeto proposto."),
      heading("Investimento"),
      paragraph("Detalhe valores, condições de pagamento e parcelamento."),
      heading("Próximos passos"),
      list(["Aprovação da proposta", "Assinatura do contrato", "Início do onboarding"]),
    ],
  },
  {
    key: "diagnostico",
    name: "Diagnóstico",
    description: "Levantamento inicial de cenário, dores e oportunidades do cliente.",
    contentType: "documento",
    blocks: [
      heading("Diagnóstico"),
      heading("Cenário atual"),
      paragraph("Descreva o contexto atual do cliente."),
      heading("Dores identificadas"),
      list(["Dor 1", "Dor 2", "Dor 3"]),
      heading("Oportunidades"),
      paragraph("Descreva as oportunidades de melhoria."),
    ],
  },
  {
    key: "briefing",
    name: "Briefing",
    description: "Coleta estruturada de informações antes do início de um projeto.",
    contentType: "documento",
    blocks: [
      heading("Briefing"),
      heading("Objetivos"),
      paragraph("Quais objetivos o cliente quer alcançar?"),
      heading("Público-alvo"),
      paragraph("Descreva o público-alvo do projeto."),
      heading("Referências"),
      paragraph("Liste referências visuais/funcionais relevantes."),
    ],
  },
  {
    key: "contrato",
    name: "Contrato",
    description: "Modelo base de contrato de prestação de serviços.",
    contentType: "contrato",
    blocks: [
      heading("Contrato de Prestação de Serviços"),
      paragraph("Contratante: \nContratada: Brusync\nObjeto: "),
      heading("Cláusulas"),
      paragraph("Descreva as cláusulas contratuais aplicáveis."),
      heading("Vigência e valores"),
      paragraph("Descreva vigência, valores e condições de pagamento."),
    ],
  },
  {
    key: "onboarding",
    name: "Onboarding",
    description: "Checklist de recepção de um novo cliente.",
    contentType: "checklist",
    blocks: [
      heading("Onboarding de Cliente"),
      checklist([
        "Enviar boas-vindas",
        "Coletar acessos necessários",
        "Agendar reunião de kickoff",
        "Criar projeto no sistema",
        "Apresentar equipe responsável",
      ]),
    ],
  },
  {
    key: "implantacao",
    name: "Implantação",
    description: "Roteiro padrão de implantação de um novo sistema/processo.",
    contentType: "playbook",
    blocks: [
      heading("Playbook de Implantação"),
      heading("Etapas"),
      list(["Configuração inicial", "Migração de dados", "Testes", "Treinamento", "Go-live"]),
      heading("Responsáveis"),
      paragraph("Defina os responsáveis por cada etapa."),
    ],
  },
  {
    key: "reuniao",
    name: "Reunião",
    description: "Ata padrão de reunião — pauta, decisões e próximos passos.",
    contentType: "documento",
    blocks: [
      heading("Ata de Reunião"),
      paragraph("Data: \nParticipantes: "),
      heading("Pauta"),
      list(["Item 1", "Item 2"]),
      heading("Decisões"),
      paragraph("Registre as decisões tomadas."),
      heading("Próximos passos"),
      checklist(["Ação 1", "Ação 2"]),
    ],
  },
  {
    key: "follow-up",
    name: "Follow-up",
    description: "Roteiro de acompanhamento pós-reunião ou pós-venda.",
    contentType: "script_comercial",
    blocks: [
      heading("Follow-up"),
      paragraph("Contexto do último contato."),
      heading("Pontos a reforçar"),
      list(["Ponto 1", "Ponto 2"]),
      heading("Chamada para ação"),
      paragraph("Qual é a próxima ação esperada do cliente/lead?"),
    ],
  },
  {
    key: "checklist-generico",
    name: "Checklist",
    description: "Checklist genérico reutilizável para qualquer processo.",
    contentType: "checklist",
    blocks: [heading("Checklist"), checklist(["Etapa 1", "Etapa 2", "Etapa 3"])],
  },
];
