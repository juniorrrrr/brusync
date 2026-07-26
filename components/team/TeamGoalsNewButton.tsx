"use client";

import { IconPlus } from "@/components/ui/icons";
import { useTeamGoalEditor } from "@/contexts/team/TeamGoalEditorContext";

export function TeamGoalsNewButton() {
  const { openCreate } = useTeamGoalEditor();
  return (
    <button type="button" className="btn btn-accent" onClick={openCreate}>
      <IconPlus size={13} /> Nova meta
    </button>
  );
}
