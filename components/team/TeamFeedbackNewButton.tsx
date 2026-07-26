"use client";

import { IconPlus } from "@/components/ui/icons";
import { useTeamFeedbackComposer } from "@/contexts/team/TeamFeedbackComposerContext";

export function TeamFeedbackNewButton() {
  const { openFor } = useTeamFeedbackComposer();
  return (
    <button type="button" className="btn btn-accent" onClick={() => openFor()}>
      <IconPlus size={13} /> Novo feedback
    </button>
  );
}
