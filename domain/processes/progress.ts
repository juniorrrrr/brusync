import type {
  ProcessChecklistItemStatus,
  ProcessStatus,
  ProcessStepStatus,
} from "@/types/processes";

export interface ChecklistProgress {
  total: number;
  done: number;
  percent: number;
}

export function computeChecklistProgress(
  items: { status: ProcessChecklistItemStatus }[],
): ChecklistProgress {
  const total = items.length;
  const done = items.filter((item) => item.status === "concluido").length;
  return { total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/** "Tempo executado" nunca é uma coluna própria — é sempre derivado de
 * started_at/completed_at (ou "agora" se ainda em andamento), mesmo
 * princípio de "nunca uma coluna redundante" do view_count da Fase 18. */
export function computeExecutedMinutes(
  startedAt: string | null,
  completedAt: string | null,
): number | null {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  if (end <= start) return 0;
  return Math.round((end - start) / 60_000);
}

export function computeStepProgressPercent(step: {
  status: ProcessStepStatus;
  checklistItems: { status: ProcessChecklistItemStatus }[];
}): number {
  if (step.checklistItems.length > 0) {
    return computeChecklistProgress(step.checklistItems).percent;
  }
  if (step.status === "concluido") return 100;
  if (step.status === "em_andamento") return 50;
  return 0;
}

/** Progresso geral do processo: prioriza o checklist inteiro (todos os itens,
 * de qualquer etapa ou avulsos — process_id sempre preenchido), cai para a
 * proporção de etapas concluídas quando não há nenhum item de checklist, e só
 * usa um valor aproximado por status quando o processo não tem nem checklist
 * nem etapas ainda. */
export function computeProcessProgressPercent(params: {
  checklistTotal: number;
  checklistDone: number;
  stepTotal: number;
  stepsDone: number;
  status: ProcessStatus;
}): number {
  if (params.checklistTotal > 0) {
    return Math.round((params.checklistDone / params.checklistTotal) * 100);
  }
  if (params.stepTotal > 0) {
    return Math.round((params.stepsDone / params.stepTotal) * 100);
  }
  if (params.status === "concluido") return 100;
  if (params.status === "arquivado" || params.status === "rascunho") return 0;
  return 50;
}
