import { DEMO_LEADS, DEMO_OWNERS } from "@/lib/demo/mockSeed";
import type {
  WhatsappAccount,
  WhatsappAutomation,
  WhatsappConversation,
  WhatsappConversationDetail,
  WhatsappLabel,
  WhatsappMessage,
  WhatsappTemplate,
  WhatsappWebhookLogEntry,
} from "@/types/whatsapp";

/** Fictitious dataset for "Modo Demonstração" — nunca gravado no Supabase,
 * nunca chama a Graph API. Contatos reaproveitam os mesmos DEMO_LEADS/
 * DEMO_OWNERS já usados em CRM/Comunicação (mockSeed.ts, mockCommunication.ts)
 * para os números baterem com o resto do sistema em Modo Demonstração. */

let seq = 0;
function demoId(prefix: string): string {
  seq += 1;
  return `00000000-wa00-4000-8000-${prefix}${String(seq).padStart(9, "0")}`;
}

const now = new Date();
function minutesAgo(minutes: number): string {
  return new Date(now.getTime() - minutes * 60 * 1000).toISOString();
}

export const DEMO_WHATSAPP_ACCOUNT: WhatsappAccount = {
  id: demoId("acc"),
  phoneNumberId: "109876543210000",
  wabaId: "987654321000000",
  displayPhoneNumber: "+55 47 99999-0000",
  displayName: "Brusync Atendimento",
  status: "conectado",
  lastSyncAt: minutesAgo(15),
  error: null,
  createdAt: minutesAgo(60 * 24 * 30),
  updatedAt: minutesAgo(15),
};

export const DEMO_WHATSAPP_LABELS: WhatsappLabel[] = [
  { id: demoId("label"), name: "Urgente", color: "#e5484d" },
  { id: demoId("label"), name: "VIP", color: "#e8a33d" },
  { id: demoId("label"), name: "Aguardando", color: "#1f5eff" },
  { id: demoId("label"), name: "Resolvido", color: "#12a594" },
];

interface ConversationSeed {
  leadIndex: number;
  ownerIndex: number;
  status: WhatsappConversation["status"];
  favorite: boolean;
  unread: number;
  labelIndexes: number[];
  minutesAgo: number;
  messages: {
    direction: "inbound" | "outbound";
    body: string;
    status: WhatsappMessage["status"];
  }[];
}

const CONVERSATION_SEEDS: ConversationSeed[] = [
  {
    leadIndex: 0,
    ownerIndex: 1,
    status: "aberta",
    favorite: true,
    unread: 2,
    labelIndexes: [0, 2],
    minutesAgo: 12,
    messages: [
      {
        direction: "inbound",
        body: "Olá! Vi o anúncio de vocês, gostaria de saber mais.",
        status: "lido",
      },
      {
        direction: "outbound",
        body: "Olá, Marcelo! Claro, posso te ajudar com isso.",
        status: "lido",
      },
      { direction: "inbound", body: "Qual o valor do plano completo?", status: "entregue" },
      {
        direction: "inbound",
        body: "E vocês atendem clínicas pequenas também?",
        status: "entregue",
      },
    ],
  },
  {
    leadIndex: 1,
    ownerIndex: 2,
    status: "aberta",
    favorite: false,
    unread: 0,
    labelIndexes: [1],
    minutesAgo: 45,
    messages: [
      {
        direction: "outbound",
        body: "Oi, Fernanda! Tudo bem? Passando para confirmar nossa reunião de amanhã.",
        status: "lido",
      },
      { direction: "inbound", body: "Oi! Sim, confirmado às 14h.", status: "lido" },
    ],
  },
  {
    leadIndex: 6,
    ownerIndex: 1,
    status: "pendente",
    favorite: false,
    unread: 1,
    labelIndexes: [2],
    minutesAgo: 180,
    messages: [
      {
        direction: "inbound",
        body: "Bom dia! Vocês fecham pedido para distribuidora?",
        status: "entregue",
      },
      {
        direction: "outbound",
        body: "Bom dia, Eduardo! Fechamos sim, me conta mais sobre o volume.",
        status: "lido",
      },
      { direction: "inbound", body: "Cerca de 200 pedidos por mês.", status: "entregue" },
    ],
  },
  {
    leadIndex: 16,
    ownerIndex: 1,
    status: "aberta",
    favorite: true,
    unread: 0,
    labelIndexes: [],
    minutesAgo: 300,
    messages: [
      {
        direction: "outbound",
        body: "Segue a proposta comercial em anexo, Marcos!",
        status: "lido",
      },
      { direction: "inbound", body: "Recebido, vamos analisar internamente.", status: "lido" },
      {
        direction: "outbound",
        body: "Perfeito, fico à disposição para dúvidas.",
        status: "entregue",
      },
    ],
  },
  {
    leadIndex: 20,
    ownerIndex: 1,
    status: "encerrada",
    favorite: false,
    unread: 0,
    labelIndexes: [3],
    minutesAgo: 4000,
    messages: [
      {
        direction: "inbound",
        body: "Muito obrigado pelo atendimento, ficamos muito satisfeitos!",
        status: "lido",
      },
      {
        direction: "outbound",
        body: "Nós que agradecemos a confiança, Alexandre! Qualquer coisa é só chamar.",
        status: "lido",
      },
    ],
  },
  {
    leadIndex: 24,
    ownerIndex: 3,
    status: "aberta",
    favorite: false,
    unread: 3,
    labelIndexes: [0],
    minutesAgo: 8,
    messages: [
      {
        direction: "inbound",
        body: "Preciso urgente de uma resposta sobre o orçamento.",
        status: "entregue",
      },
      { direction: "inbound", body: "Vocês ainda estão avaliando?", status: "entregue" },
      { direction: "inbound", body: "Fico no aguardo, obrigado.", status: "entregue" },
    ],
  },
];

const conversationIds = CONVERSATION_SEEDS.map(() => demoId("conv"));

function buildConversation(seed: ConversationSeed, index: number): WhatsappConversation {
  const lead = DEMO_LEADS[seed.leadIndex];
  const owner = DEMO_OWNERS[seed.ownerIndex];
  const lastMessage = seed.messages[seed.messages.length - 1];
  return {
    id: conversationIds[index],
    accountId: DEMO_WHATSAPP_ACCOUNT.id,
    contact: {
      id: demoId("contact"),
      accountId: DEMO_WHATSAPP_ACCOUNT.id,
      waId: `55${lead.phone}`,
      profileName: lead.name,
      phoneNumber: lead.phone,
      crmLeadId: lead.id,
      clientId: null,
      optedIn: true,
      createdAt: minutesAgo(seed.minutesAgo + 100),
    },
    status: seed.status,
    isFavorite: seed.favorite,
    isArchived: false,
    ownerId: owner.id,
    ownerName: owner.name,
    crmLeadId: lead.id,
    crmLeadName: lead.name,
    clientId: null,
    clientCompany: null,
    projectId: null,
    projectName: null,
    labels: seed.labelIndexes.map((i) => DEMO_WHATSAPP_LABELS[i]),
    lastMessageAt: minutesAgo(seed.minutesAgo),
    lastMessagePreview: lastMessage.body,
    lastMessageDirection: lastMessage.direction,
    unreadCount: seed.unread,
    createdAt: minutesAgo(seed.minutesAgo + 100),
    updatedAt: minutesAgo(seed.minutesAgo),
  };
}

const DEMO_CONVERSATIONS: WhatsappConversation[] = CONVERSATION_SEEDS.map(buildConversation);

const DEMO_MESSAGES: Record<string, WhatsappMessage[]> = Object.fromEntries(
  CONVERSATION_SEEDS.map((seed, index) => {
    const conversationId = conversationIds[index];
    const owner = DEMO_OWNERS[seed.ownerIndex];
    const messages: WhatsappMessage[] = seed.messages.map((turn, turnIndex) => ({
      id: demoId("msg"),
      conversationId,
      direction: turn.direction,
      type: "texto",
      body: turn.body,
      attachment: null,
      templateName: null,
      waMessageId: `wamid.demo.${conversationId}.${turnIndex}`,
      status: turn.status,
      error: null,
      senderProfileId: turn.direction === "outbound" ? owner.id : null,
      senderName: turn.direction === "outbound" ? owner.name : null,
      createdAt: minutesAgo(seed.minutesAgo + (seed.messages.length - turnIndex) * 4),
    }));
    return [conversationId, messages];
  }),
);

export function getDemoWhatsappAccount(): WhatsappAccount {
  return DEMO_WHATSAPP_ACCOUNT;
}

export function getDemoWhatsappLabels(): WhatsappLabel[] {
  return DEMO_WHATSAPP_LABELS;
}

export function getDemoWhatsappConversations(): WhatsappConversation[] {
  return [...DEMO_CONVERSATIONS].sort((a, b) =>
    (a.lastMessageAt ?? "") < (b.lastMessageAt ?? "") ? 1 : -1,
  );
}

export function getDemoWhatsappConversationDetail(id: string): WhatsappConversationDetail | null {
  const conversation = DEMO_CONVERSATIONS.find((c) => c.id === id);
  if (!conversation) return null;
  return { ...conversation, messages: DEMO_MESSAGES[id] ?? [] };
}

const TEMPLATE_SEEDS: {
  name: string;
  category: WhatsappTemplate["category"];
  status: WhatsappTemplate["status"];
  body: string;
}[] = [
  {
    name: "boas_vindas",
    category: "utility",
    status: "aprovado",
    body: "Olá {{1}}! Bem-vindo(a) à Brusync. Como podemos ajudar?",
  },
  {
    name: "confirmacao_agendamento",
    category: "utility",
    status: "aprovado",
    body: "Olá {{1}}, confirmando seu agendamento em {{2}}.",
  },
  {
    name: "cobranca_gentil",
    category: "utility",
    status: "aprovado",
    body: "Olá {{1}}, notamos que a parcela de {{2}} está em aberto.",
  },
  {
    name: "proposta_comercial",
    category: "marketing",
    status: "pendente",
    body: "Olá {{1}}! Preparamos uma proposta especial para você.",
  },
  {
    name: "pesquisa_satisfacao",
    category: "marketing",
    status: "rejeitado",
    body: "Olá {{1}}, como foi sua experiência com a gente?",
  },
];

const DEMO_TEMPLATES: WhatsappTemplate[] = TEMPLATE_SEEDS.map((seed, index) => ({
  id: demoId("tpl"),
  accountId: DEMO_WHATSAPP_ACCOUNT.id,
  name: seed.name,
  category: seed.category,
  language: "pt_BR",
  status: seed.status,
  components: [
    {
      type: "body",
      text: seed.body,
      variables: ["1", "2"].filter((v) => seed.body.includes(`{{${v}}}`)),
    },
  ],
  metaTemplateId: seed.status === "aprovado" ? `meta-tpl-${index}` : null,
  createdAt: minutesAgo(60 * 24 * (30 - index * 2)),
  updatedAt: minutesAgo(60 * 24 * 2),
}));

export function getDemoWhatsappTemplates(): WhatsappTemplate[] {
  return DEMO_TEMPLATES;
}

const AUTOMATION_TRIGGER_SEEDS: WhatsappAutomation["triggerType"][] = [
  "novo_lead",
  "agendamento_confirmado",
  "pagamento_recebido",
  "aniversario",
];

const DEMO_AUTOMATIONS: WhatsappAutomation[] = AUTOMATION_TRIGGER_SEEDS.map((trigger, index) => {
  const template = DEMO_TEMPLATES[index % DEMO_TEMPLATES.length];
  return {
    id: demoId("auto"),
    accountId: DEMO_WHATSAPP_ACCOUNT.id,
    triggerType: trigger,
    templateId: template.id,
    templateName: template.name,
    status: index === 3 ? "inativo" : "ativo",
    config: {},
    createdAt: minutesAgo(60 * 24 * 20),
    updatedAt: minutesAgo(60 * 24 * 5),
  };
});

export function getDemoWhatsappAutomations(): WhatsappAutomation[] {
  return DEMO_AUTOMATIONS;
}

const DEMO_WEBHOOK_LOGS: WhatsappWebhookLogEntry[] = Array.from({ length: 10 }, (_, i) => ({
  id: demoId("hook"),
  accountId: DEMO_WHATSAPP_ACCOUNT.id,
  eventType: i % 3 === 0 ? "messages" : i % 3 === 1 ? "message_template_status_update" : "messages",
  processed: true,
  error: null,
  createdAt: minutesAgo(i * 37),
}));

export function getDemoWhatsappWebhookLogs(): WhatsappWebhookLogEntry[] {
  return DEMO_WEBHOOK_LOGS;
}

export function getDemoWhatsappDashboardNumbers() {
  const allMessages = Object.values(DEMO_MESSAGES).flat();
  return {
    messagesSent: allMessages.filter((m) => m.direction === "outbound").length,
    messagesReceived: allMessages.filter((m) => m.direction === "inbound").length,
    averageResponseMinutes: 6.5,
    openConversations: DEMO_CONVERSATIONS.filter((c) => c.status !== "encerrada").length,
    closedConversations: DEMO_CONVERSATIONS.filter((c) => c.status === "encerrada").length,
    templatesSent: 18,
    failures: 1,
  };
}
