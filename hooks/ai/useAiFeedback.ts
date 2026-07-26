"use client";

import { useState, useTransition } from "react";
import { submitAiFeedbackAction } from "@/application/ai/aiChatActions";
import type { AiFeedbackRating, AiFeedbackTargetType } from "@/types/ai";

export function useAiFeedback(targetType: AiFeedbackTargetType, targetId: string) {
  const [rating, setRating] = useState<AiFeedbackRating | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(next: AiFeedbackRating) {
    const previous = rating;
    setRating(next);
    startTransition(async () => {
      const result = await submitAiFeedbackAction(targetType, targetId, next);
      if (!result.ok) setRating(previous);
    });
  }

  return { rating, submit, isPending };
}
