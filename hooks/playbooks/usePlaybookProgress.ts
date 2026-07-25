import type { PlaybookDetail, PlaybookSummary } from "@/types/playbooks";

export function usePlaybookProgress(playbook: PlaybookDetail | PlaybookSummary): number {
  if (playbook.stepCount === 0) return 0;
  return Math.round((playbook.completedStepCount / playbook.stepCount) * 100);
}
