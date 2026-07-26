import { PROCESS_STATUS_LABEL } from "@/domain/processes/statusMeta";
import type {
  ProcessApprovalStatus,
  ProcessHistoryEventType,
  ProcessStatus,
} from "@/types/processes";

/** Uma função por tipo de evento — texto em português já pronto para
 * armazenar em crm_process_history.description, gerado no momento da escrita
 * pela camada de serviço (nunca montado na leitura, para não perder o
 * contexto exato de quem/o quê no momento da alteração). */

export function describeProcessCreated(name: string): string {
  return `Processo "${name}" criado.`;
}

export function describeProcessUpdated(): string {
  return "Dados do processo atualizados.";
}

export function describeStatusChanged(from: ProcessStatus, to: ProcessStatus): string {
  return `Status alterado de "${PROCESS_STATUS_LABEL[from]}" para "${PROCESS_STATUS_LABEL[to]}".`;
}

export function describeOwnerChanged(fromName: string | null, toName: string | null): string {
  if (!fromName) return `Responsável definido como ${toName ?? "ninguém"}.`;
  if (!toName) return `Responsável removido (era ${fromName}).`;
  return `Responsável alterado de ${fromName} para ${toName}.`;
}

export function describeStepStarted(stepName: string): string {
  return `Etapa "${stepName}" iniciada.`;
}

export function describeStepCompleted(stepName: string): string {
  return `Etapa "${stepName}" concluída.`;
}

export function describeChecklistItemCompleted(label: string): string {
  return `Item de checklist concluído: "${label}".`;
}

export function describeChecklistItemReopened(label: string): string {
  return `Item de checklist reaberto: "${label}".`;
}

export function describeDocumentAttached(title: string): string {
  return `Documento da Base de Conhecimento vinculado: "${title}".`;
}

export function describeFileAttached(fileName: string): string {
  return `Arquivo anexado: "${fileName}".`;
}

export function describeApprovalRequested(scopeLabel: string): string {
  return `Aprovação solicitada${scopeLabel ? ` para ${scopeLabel}` : ""}.`;
}

export function describeApprovalDecided(
  status: ProcessApprovalStatus,
  approverName: string | null,
): string {
  const decision = status === "aprovado" ? "aprovado" : "reprovado";
  return `Processo ${decision}${approverName ? ` por ${approverName}` : ""}.`;
}

export function describeProcessArchived(): string {
  return "Processo arquivado.";
}

export const PROCESS_HISTORY_EVENT_LABEL: Record<ProcessHistoryEventType, string> = {
  processo_criado: "Processo criado",
  processo_atualizado: "Processo atualizado",
  status_alterado: "Status alterado",
  responsavel_alterado: "Responsável alterado",
  etapa_iniciada: "Etapa iniciada",
  etapa_concluida: "Etapa concluída",
  checklist_item_concluido: "Checklist concluído",
  checklist_item_reaberto: "Checklist reaberto",
  documento_anexado: "Documento anexado",
  arquivo_anexado: "Arquivo anexado",
  aprovacao_solicitada: "Aprovação solicitada",
  aprovacao_decidida: "Aprovação decidida",
  processo_arquivado: "Processo arquivado",
};
