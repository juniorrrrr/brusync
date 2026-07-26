import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiFeedbackRating, AiFeedbackTargetType } from "@/types/ai";

export interface CreateFeedbackPayload {
  targetType: AiFeedbackTargetType;
  targetId: string;
  rating: AiFeedbackRating;
  comment?: string | null;
  createdBy: string | null;
}

export async function createFeedback(
  supabase: SupabaseClient,
  payload: CreateFeedbackPayload,
): Promise<void> {
  const { error } = await supabase.from("ai_feedback").insert({
    target_type: payload.targetType,
    target_id: payload.targetId,
    rating: payload.rating,
    comment: payload.comment ?? null,
    created_by: payload.createdBy,
  });
  if (error) throw new Error(`Falha ao registrar feedback: ${error.message}`);
}
