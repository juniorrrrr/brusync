"use client";

import { IconPlus } from "@/components/ui/icons";
import { useTeamCheckinScheduler } from "@/contexts/team/TeamCheckinSchedulerContext";

export function TeamCheckinNewButton() {
  const { openFor } = useTeamCheckinScheduler();
  return (
    <button type="button" className="btn btn-accent" onClick={() => openFor()}>
      <IconPlus size={13} /> Agendar check-in
    </button>
  );
}
