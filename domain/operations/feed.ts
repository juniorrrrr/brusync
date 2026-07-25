import type { EventType } from "@/domain/events/types";
import type { AutomationLogEntry } from "@/types/automation";
import type { Conversation } from "@/types/communication";
import type { ConversionEvent } from "@/types/conversions";
import type { KnowledgeDocumentSummary } from "@/types/knowledge";
import type { OperationsFeedItem } from "@/types/operations";
import type { Project } from "@/types/projects";

export interface IntegrationEventRow {
  id: string;
  event_type: string;
  entity_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

const EVENT_SENTENCE: Partial<Record<EventType, (payload: Record<string, unknown>) => string>> = {
  LeadCreated: (p) =>
    `Novo lead recebido: ${p.name ?? "sem nome"}${p.company ? ` (${p.company})` : ""}.`,
  LeadQualified: (p) => `Lead qualificado — avançou para "${p.stageLabel ?? "próxima etapa"}".`,
  LeadWon: (p) =>
    `Venda registrada${typeof p.revenue === "number" ? ` — ${p.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : ""}.`,
  LeadLost: () => "Lead perdido.",
  ClientCreated: (p) => `Novo cliente: ${p.company ?? "—"}.`,
  ClientActivated: () => "Cliente ativado.",
  ProposalSent: () => "Nova proposta enviada.",
  MeetingScheduled: () => "Reunião agendada.",
  RevenueRegistered: (p) =>
    `Pagamento registrado${typeof p.amount === "number" ? ` — ${p.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : ""}.`,
  CampaignCreated: (p) => `Nova campanha: ${p.utmCampaign ?? p.utmSource ?? "—"}.`,
  TaskCompleted: (p) => `Tarefa concluída: ${p.title ?? "—"}.`,
};

/** Every mapper here turns an already-typed row from an existing module
 * into the same OperationsFeedItem shape — no query, no business rule,
 * just a deterministic transformation the services layer calls after
 * fetching from each module's own repository/application function. */
export function mapIntegrationEventToFeedItem(row: IntegrationEventRow): OperationsFeedItem | null {
  const template = EVENT_SENTENCE[row.event_type as EventType];
  if (!template) return null;

  return {
    id: `event-${row.id}`,
    sourceType: row.event_type.startsWith("Client")
      ? "client"
      : row.event_type.startsWith("Campaign")
        ? "campaign"
        : "lead",
    sentence: template(row.payload ?? {}),
    occurredAt: row.created_at,
    href: row.event_type.startsWith("Client") ? "/clientes" : "/leads",
  };
}

export function mapProjectCreatedToFeedItem(project: Project): OperationsFeedItem {
  return {
    id: `project-created-${project.id}`,
    sourceType: "project",
    sentence: `Projeto criado: ${project.name}${project.clientCompany ? ` — ${project.clientCompany}` : ""}.`,
    occurredAt: project.createdAt,
    href: "/projetos",
  };
}

export function mapProjectCompletedToFeedItem(project: Project): OperationsFeedItem | null {
  if (!project.completedAt) return null;
  return {
    id: `project-completed-${project.id}`,
    sourceType: "project",
    sentence: `Projeto concluído: ${project.name}${project.clientCompany ? ` — ${project.clientCompany}` : ""}.`,
    occurredAt: project.completedAt,
    href: "/projetos",
  };
}

export function mapPaidTransactionToFeedItem(transaction: {
  id: string;
  description: string;
  amount: number;
  updatedAt: string;
  clientCompany: string | null;
}): OperationsFeedItem {
  return {
    id: `financial-${transaction.id}`,
    sourceType: "financial",
    sentence: `Pagamento recebido: ${transaction.description} — ${transaction.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
    occurredAt: transaction.updatedAt,
    href: "/financeiro/lancamentos",
  };
}

export function mapInboundMessageToFeedItem(conversation: Conversation): OperationsFeedItem | null {
  if (conversation.lastMessageDirection !== "inbound" || !conversation.lastMessageAt) return null;
  const who =
    conversation.crmLeadName ?? conversation.clientCompany ?? conversation.contactName ?? "contato";
  return {
    id: `message-${conversation.id}-${conversation.lastMessageAt}`,
    sourceType: "message",
    sentence: `Mensagem recebida de ${who}${conversation.lastMessagePreview ? `: "${conversation.lastMessagePreview.slice(0, 60)}"` : ""}.`,
    occurredAt: conversation.lastMessageAt,
    href: "/comunicacao",
  };
}

export function mapAutomationLogToFeedItem(log: AutomationLogEntry): OperationsFeedItem | null {
  if (log.level !== "info" || !log.workflowName) return null;
  return {
    id: `automation-${log.id}`,
    sourceType: "automation",
    sentence: `Automação executada: ${log.workflowName}.`,
    occurredAt: log.createdAt,
    href: "/automacoes/logs",
  };
}

export function mapKnowledgeDocumentToFeedItem(
  doc: KnowledgeDocumentSummary,
): OperationsFeedItem | null {
  if (doc.status !== "publicado" || !doc.publishedAt) return null;
  return {
    id: `knowledge-${doc.id}`,
    sourceType: "knowledge",
    sentence: `Documento publicado: ${doc.title}.`,
    occurredAt: doc.publishedAt,
    href: `/base-conhecimento/documentos/${doc.id}`,
  };
}

const CONVERSION_TYPE_LABEL: Record<string, string> = {
  lead: "Novo lead capturado",
  qualified_lead: "Lead qualificado",
  meeting_scheduled: "Reunião agendada",
  proposal_sent: "Proposta enviada",
  purchase: "Compra registrada",
  lost_lead: "Lead perdido",
  client_activated: "Cliente ativado",
};

export function mapConversionEventToFeedItem(event: ConversionEvent): OperationsFeedItem {
  const label = CONVERSION_TYPE_LABEL[event.conversionType] ?? "Conversão registrada";
  const who = event.leadName ?? event.clientName;
  return {
    id: `conversion-${event.id}`,
    sourceType: "conversion",
    sentence: `${label}${who ? ` — ${who}` : ""}${event.utmSource ? ` (${event.utmSource})` : ""}.`,
    occurredAt: event.occurredAt,
    href: "/conversoes",
  };
}

/** Merges every source's already-mapped items and sorts newest-first —
 * Feed and Timeline are the SAME merge, just sliced to a different length
 * by the caller (see services/operations/operationsFeedService.ts), so the
 * ordering logic exists exactly once. */
export function mergeFeed(...sources: (OperationsFeedItem | null)[][]): OperationsFeedItem[] {
  return sources
    .flat()
    .filter((item): item is OperationsFeedItem => item !== null)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}
