import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProcessApproval, ProcessApprovalStatus } from "@/types/processes";

interface ApprovalRow {
  id: string;
  process_id: string;
  step_id: string | null;
  status: ProcessApprovalStatus;
  notes: string | null;
  decided_at: string | null;
  requested_by: string | null;
  approver_id: string | null;
  created_at: string;
  step?: { name: string } | null;
  requester?: { name: string | null; email: string | null } | null;
  approver?: { name: string | null; email: string | null } | null;
}

const APPROVAL_SELECT = `
  id, process_id, step_id, status, notes, decided_at, requested_by, approver_id, created_at,
  step:crm_process_steps!crm_process_approvals_step_id_fkey(name),
  requester:profiles!crm_process_approvals_requested_by_fkey(name, email),
  approver:profiles!crm_process_approvals_approver_id_fkey(name, email)
`;

function mapApproval(row: ApprovalRow): ProcessApproval {
  return {
    id: row.id,
    processId: row.process_id,
    stepId: row.step_id,
    stepName: row.step?.name ?? null,
    status: row.status,
    notes: row.notes,
    decidedAt: row.decided_at,
    requestedById: row.requested_by,
    requestedByName: row.requester?.name ?? row.requester?.email ?? null,
    approverId: row.approver_id,
    approverName: row.approver?.name ?? row.approver?.email ?? null,
    createdAt: row.created_at,
  };
}

export async function listApprovalsForProcess(
  supabase: SupabaseClient,
  processId: string,
): Promise<ProcessApproval[]> {
  const { data, error } = await supabase
    .from("crm_process_approvals")
    .select(APPROVAL_SELECT)
    .eq("process_id", processId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar aprovações: ${error.message}`);
  return ((data ?? []) as unknown as ApprovalRow[]).map(mapApproval);
}

export async function listPendingApprovals(
  supabase: SupabaseClient,
  limit = 10,
): Promise<ProcessApproval[]> {
  const { data, error } = await supabase
    .from("crm_process_approvals")
    .select(APPROVAL_SELECT)
    .eq("status", "pendente")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar aprovações pendentes: ${error.message}`);
  return ((data ?? []) as unknown as ApprovalRow[]).map(mapApproval);
}

export interface CreateApprovalPayload {
  processId: string;
  stepId: string | null;
  notes: string | null;
  requestedBy: string | null;
}

export async function createApprovalRequest(
  supabase: SupabaseClient,
  payload: CreateApprovalPayload,
): Promise<ProcessApproval> {
  const { data, error } = await supabase
    .from("crm_process_approvals")
    .insert({
      process_id: payload.processId,
      step_id: payload.stepId,
      notes: payload.notes,
      requested_by: payload.requestedBy,
    })
    .select(APPROVAL_SELECT)
    .single();

  if (error) throw new Error(`Falha ao solicitar aprovação: ${error.message}`);
  return mapApproval(data as unknown as ApprovalRow);
}

export interface DecideApprovalPayload {
  status: "aprovado" | "reprovado";
  approverId: string | null;
  notes: string | null;
}

export async function decideApproval(
  supabase: SupabaseClient,
  id: string,
  payload: DecideApprovalPayload,
): Promise<ProcessApproval> {
  const { data, error } = await supabase
    .from("crm_process_approvals")
    .update({
      status: payload.status,
      approver_id: payload.approverId,
      notes: payload.notes,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(APPROVAL_SELECT)
    .single();

  if (error) throw new Error(`Falha ao decidir aprovação: ${error.message}`);
  return mapApproval(data as unknown as ApprovalRow);
}
