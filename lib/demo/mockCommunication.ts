import {
  getDemoClientsPageData,
  getDemoLeadsPageData,
  getDemoOwnerOptions,
} from "@/lib/demo/mockCrm";
import type { ListConversationsOptions } from "@/repositories/communication/conversationsRepository";
import type {
  Channel,
  ChannelType,
  Conversation,
  ConversationDetail,
  ConversationStatus,
  ConversationSubjectInfo,
  Message,
  MessageEvent,
  MessageTemplate,
} from "@/types/communication";

function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

const DEMO_CHANNELS: { id: string; type: ChannelType; name: string }[] = [
  { id: "00000000-c015-4000-8000-000000000001", type: "whatsapp", name: "WhatsApp" },
  {
    id: "00000000-c015-4000-8000-000000000002",
    type: "whatsapp_business_api",
    name: "WhatsApp Business Cloud API",
  },
  { id: "00000000-c015-4000-8000-000000000003", type: "evolution_api", name: "Evolution API" },
  { id: "00000000-c015-4000-8000-000000000004", type: "messenger", name: "Messenger" },
  {
    id: "00000000-c015-4000-8000-000000000005",
    type: "instagram_direct",
    name: "Instagram Direct",
  },
  { id: "00000000-c015-4000-8000-000000000006", type: "email", name: "E-mail" },
  { id: "00000000-c015-4000-8000-000000000007", type: "phone", name: "Telefone" },
  { id: "00000000-c015-4000-8000-000000000008", type: "internal", name: "Chat interno" },
];

export function getDemoChannels(): Channel[] {
  return DEMO_CHANNELS.map((c) => ({ ...c, isActive: true }));
}

export function getDemoMessageTemplates(): MessageTemplate[] {
  return [
    {
      id: "00000000-c016-4000-8000-000000000001",
      name: "Boas-vindas",
      body: "Olá! Obrigado por entrar em contato com a Brusync. Como posso ajudar?",
      channelType: null,
      createdAt: minutesAgoIso(60 * 24 * 10),
    },
    {
      id: "00000000-c016-4000-8000-000000000002",
      name: "Follow-up de proposta",
      body: "Oi! Passando para saber se conseguiu revisar a proposta que enviamos. Fico à disposição para qualquer dúvida.",
      channelType: null,
      createdAt: minutesAgoIso(60 * 24 * 8),
    },
    {
      id: "00000000-c016-4000-8000-000000000003",
      name: "Confirmação de reunião",
      body: "Confirmando nossa reunião. Qualquer imprevisto, me avise por aqui mesmo.",
      channelType: "whatsapp",
      createdAt: minutesAgoIso(60 * 24 * 5),
    },
  ];
}

interface DemoPlan {
  channelIndex: number;
  subject: "lead" | "client";
  subjectIndex: number;
  status: ConversationStatus;
  isFavorite: boolean;
  isArchived: boolean;
  unreadCount: number;
  lastMessageMinutesAgo: number;
  messages: { direction: "inbound" | "outbound"; body: string; minutesAgo: number }[];
}

function planFor(index: number): DemoPlan {
  const patterns: DemoPlan[] = [
    {
      channelIndex: 0,
      subject: "lead",
      subjectIndex: 0,
      status: "aberta",
      isFavorite: true,
      isArchived: false,
      unreadCount: 2,
      lastMessageMinutesAgo: 6,
      messages: [
        {
          direction: "inbound",
          body: "Oi, vi o anúncio de vocês. Como funciona o CRM?",
          minutesAgo: 40,
        },
        {
          direction: "outbound",
          body: "Olá! O Brusync OS unifica CRM, projetos e financeiro em um só lugar. Posso te mostrar uma demonstração?",
          minutesAgo: 32,
        },
        { direction: "inbound", body: "Pode ser sim, qual o valor do plano?", minutesAgo: 6 },
      ],
    },
    {
      channelIndex: 4,
      subject: "lead",
      subjectIndex: 1,
      status: "pendente",
      isFavorite: false,
      isArchived: false,
      unreadCount: 1,
      lastMessageMinutesAgo: 180,
      messages: [
        { direction: "inbound", body: "Vocês têm integração com WhatsApp?", minutesAgo: 190 },
        {
          direction: "outbound",
          body: "Ainda não nesta fase, mas já está no roadmap para o próximo módulo.",
          minutesAgo: 185,
        },
        { direction: "inbound", body: "Combinado, aguardo novidades!", minutesAgo: 180 },
      ],
    },
    {
      channelIndex: 5,
      subject: "lead",
      subjectIndex: 2,
      status: "aberta",
      isFavorite: false,
      isArchived: false,
      unreadCount: 0,
      lastMessageMinutesAgo: 15,
      messages: [
        {
          direction: "outbound",
          body: "Segue em anexo a proposta comercial conversada.",
          minutesAgo: 20,
        },
        { direction: "inbound", body: "Recebido, vou analisar com o time.", minutesAgo: 15 },
      ],
    },
    {
      channelIndex: 1,
      subject: "lead",
      subjectIndex: 3,
      status: "encerrada",
      isFavorite: false,
      isArchived: true,
      unreadCount: 0,
      lastMessageMinutesAgo: 60 * 24 * 3,
      messages: [
        {
          direction: "inbound",
          body: "Obrigado pelo atendimento, por enquanto vamos seguir com outra solução.",
          minutesAgo: 60 * 24 * 3,
        },
        {
          direction: "outbound",
          body: "Tudo bem, ficamos à disposição se mudar de ideia!",
          minutesAgo: 60 * 24 * 3 - 5,
        },
      ],
    },
    {
      channelIndex: 3,
      subject: "lead",
      subjectIndex: 4,
      status: "aberta",
      isFavorite: true,
      isArchived: false,
      unreadCount: 3,
      lastMessageMinutesAgo: 3,
      messages: [
        {
          direction: "inbound",
          body: "Bom dia! Podemos agendar uma call essa semana?",
          minutesAgo: 10,
        },
        {
          direction: "outbound",
          body: "Bom dia! Consigo na quinta às 15h, funciona?",
          minutesAgo: 7,
        },
        { direction: "inbound", body: "Perfeito, fechado.", minutesAgo: 3 },
      ],
    },
    {
      channelIndex: 6,
      subject: "lead",
      subjectIndex: 5,
      status: "pendente",
      isFavorite: false,
      isArchived: false,
      unreadCount: 0,
      lastMessageMinutesAgo: 90,
      messages: [
        {
          direction: "outbound",
          body: "Ligação registrada: cliente pediu para retornarmos amanhã.",
          minutesAgo: 90,
        },
      ],
    },
    {
      channelIndex: 7,
      subject: "client",
      subjectIndex: 0,
      status: "aberta",
      isFavorite: false,
      isArchived: false,
      unreadCount: 0,
      lastMessageMinutesAgo: 25,
      messages: [
        {
          direction: "outbound",
          body: "Time interno: implantação do projeto avançando dentro do prazo.",
          minutesAgo: 25,
        },
      ],
    },
    {
      channelIndex: 0,
      subject: "client",
      subjectIndex: 1,
      status: "aberta",
      isFavorite: true,
      isArchived: false,
      unreadCount: 1,
      lastMessageMinutesAgo: 12,
      messages: [
        { direction: "inbound", body: "O relatório do mês já está disponível?", minutesAgo: 12 },
      ],
    },
    {
      channelIndex: 2,
      subject: "client",
      subjectIndex: 2,
      status: "encerrada",
      isFavorite: false,
      isArchived: true,
      unreadCount: 0,
      lastMessageMinutesAgo: 60 * 24 * 12,
      messages: [
        {
          direction: "inbound",
          body: "Chamado resolvido, muito obrigado pelo suporte.",
          minutesAgo: 60 * 24 * 12,
        },
      ],
    },
    {
      channelIndex: 5,
      subject: "client",
      subjectIndex: 3,
      status: "pendente",
      isFavorite: false,
      isArchived: false,
      unreadCount: 0,
      lastMessageMinutesAgo: 400,
      messages: [
        {
          direction: "outbound",
          body: "Encaminhamos a nota fiscal referente ao último pagamento.",
          minutesAgo: 400,
        },
      ],
    },
  ];
  return patterns[index % patterns.length];
}

function getDemoSubjects() {
  const { leads } = getDemoLeadsPageData({});
  const { clients } = getDemoClientsPageData({});
  return { leads, clients };
}

type DemoLead = ReturnType<typeof getDemoLeadsPageData>["leads"][number];
type DemoClient = ReturnType<typeof getDemoClientsPageData>["clients"][number];

interface DemoConversationEntry {
  conversation: Conversation;
  plan: DemoPlan;
  lead: DemoLead | null;
  client: DemoClient | null;
}

function buildDemoConversations(): DemoConversationEntry[] {
  const { leads, clients } = getDemoSubjects();
  const owners = getDemoOwnerOptions();

  return Array.from({ length: 10 }, (_, index) => {
    const plan = planFor(index);
    const channel = DEMO_CHANNELS[plan.channelIndex];
    const owner = owners[index % owners.length];
    const lastMessage = plan.messages[plan.messages.length - 1];

    const lead = plan.subject === "lead" ? leads[plan.subjectIndex % leads.length] : null;
    const client = plan.subject === "client" ? clients[plan.subjectIndex % clients.length] : null;

    const conversation: Conversation = {
      id: `00000000-c017-4000-8000-${String(index + 1).padStart(12, "0")}`,
      channelId: channel.id,
      channelType: channel.type,
      channelName: channel.name,
      crmLeadId: lead?.id ?? null,
      crmLeadName: lead?.name ?? null,
      clientId: client?.id ?? null,
      clientCompany: client?.company ?? null,
      ownerId: owner.id,
      ownerName: owner.name,
      status: plan.status,
      isFavorite: plan.isFavorite,
      isArchived: plan.isArchived,
      contactName: lead?.name ?? client?.name ?? client?.company ?? null,
      contactHandle: lead?.phone ?? lead?.email ?? client?.email ?? null,
      lastMessageAt: minutesAgoIso(plan.lastMessageMinutesAgo),
      lastMessagePreview: lastMessage.body,
      lastMessageDirection: lastMessage.direction,
      unreadCount: plan.unreadCount,
      createdAt: minutesAgoIso(plan.lastMessageMinutesAgo + 60),
      updatedAt: minutesAgoIso(plan.lastMessageMinutesAgo),
    };

    return { conversation, plan, lead, client };
  });
}

function matchesFilters(entry: DemoConversationEntry, options: ListConversationsOptions): boolean {
  const { conversation, lead } = entry;
  if (options.channelId && conversation.channelId !== options.channelId) return false;
  if (options.ownerId && conversation.ownerId !== options.ownerId) return false;
  if (options.status && conversation.status !== options.status) return false;
  if (options.unreadOnly && conversation.unreadCount === 0) return false;
  if (options.archived !== undefined && conversation.isArchived !== options.archived) return false;
  if (options.favorite && !conversation.isFavorite) return false;
  if (options.origin) {
    if (!lead?.origin?.toLowerCase().includes(options.origin.toLowerCase())) return false;
  }
  if (options.city) {
    if (!lead?.city?.toLowerCase().includes(options.city.toLowerCase())) return false;
  }
  if (options.campaign) {
    // Demo leads carry no raw UTM campaign field of their own — the
    // fictitious "black-friday-2026" campaign (see getDemoConversationSubjectInfo)
    // stands in for every lead-linked conversation, matching how the info
    // panel itself reports it in Demo Mode.
    if (!lead || !"black-friday-2026".includes(options.campaign.toLowerCase())) return false;
  }
  if (options.search) {
    const term = options.search.toLowerCase();
    const haystack =
      `${conversation.crmLeadName ?? ""} ${conversation.clientCompany ?? ""} ${conversation.contactName ?? ""} ${conversation.lastMessagePreview ?? ""}`.toLowerCase();
    if (!haystack.includes(term)) return false;
  }
  return true;
}

export function getDemoConversations(options: ListConversationsOptions = {}): Conversation[] {
  return buildDemoConversations()
    .filter((entry) => matchesFilters(entry, options))
    .map(({ conversation }) => conversation)
    .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
}

export function getDemoConversationsForLead(crmLeadId: string): Conversation[] {
  return buildDemoConversations()
    .map(({ conversation }) => conversation)
    .filter((c) => c.crmLeadId === crmLeadId);
}

export function getDemoConversationsForClient(clientId: string): Conversation[] {
  return buildDemoConversations()
    .map(({ conversation }) => conversation)
    .filter((c) => c.clientId === clientId);
}

export function getDemoConversationDetail(id: string): ConversationDetail | null {
  const found = buildDemoConversations().find(({ conversation }) => conversation.id === id);
  if (!found) return null;

  const { conversation, plan } = found;
  const messages: Message[] = plan.messages.map((m, i) => ({
    id: `${conversation.id}-msg-${i + 1}`,
    conversationId: conversation.id,
    direction: m.direction,
    body: m.body,
    senderProfileId: m.direction === "outbound" ? conversation.ownerId : null,
    senderName: m.direction === "outbound" ? conversation.ownerName : conversation.contactName,
    createdAt: minutesAgoIso(m.minutesAgo),
  }));

  const events: MessageEvent[] = [
    {
      id: `${conversation.id}-evt-started`,
      conversationId: conversation.id,
      type: "conversation_started",
      actorId: conversation.ownerId,
      actorName: conversation.ownerName,
      metadata: null,
      createdAt: conversation.createdAt,
    },
    ...plan.messages.map(
      (m, i): MessageEvent => ({
        id: `${conversation.id}-evt-${i + 1}`,
        conversationId: conversation.id,
        type: m.direction === "inbound" ? "message_received" : "message_sent",
        actorId: m.direction === "outbound" ? conversation.ownerId : null,
        actorName: m.direction === "outbound" ? conversation.ownerName : conversation.contactName,
        metadata: null,
        createdAt: minutesAgoIso(m.minutesAgo),
      }),
    ),
  ];

  return { ...conversation, messages, events };
}

export function getDemoConversationSubjectInfo(
  crmLeadId: string | null,
  clientId: string | null,
): ConversationSubjectInfo {
  const { leads, clients } = getDemoSubjects();
  const lead = crmLeadId ? leads.find((l) => l.id === crmLeadId) : null;
  const client = clientId ? clients.find((c) => c.id === clientId) : null;

  return {
    crmLeadCity: lead?.city ?? null,
    crmLeadOrigin: lead?.origin ?? null,
    stageLabel: lead?.stage.label ?? null,
    utmSource: lead ? "google" : null,
    utmMedium: lead ? "cpc" : null,
    utmCampaign: lead ? "black-friday-2026" : null,
    projects: client
      ? [{ id: `${client.id}-proj`, name: "Implantação de CRM", status: "em_andamento" }]
      : [],
  };
}
