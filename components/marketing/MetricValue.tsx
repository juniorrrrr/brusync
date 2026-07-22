"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

/** Renders a pre-formatted metric value, or "—" with an explanatory Hover
 * Card when it couldn't be computed (e.g. ROAS with no investimento lançado
 * for that scope), never a fabricated zero.
 *
 * Formatting happens in the Server Component caller, not here — a function
 * prop (a formatter) can't cross the Server->Client boundary, only
 * serializable data can, so this component only ever receives the already
 * formatted string. */
export function MetricValue({
  available,
  formatted,
  unavailableHint = "Sem investimento lançado para este período/campanha ainda.",
}: {
  available: boolean;
  formatted: string | null;
  unavailableHint?: string;
}) {
  if (!available || formatted === null) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <span
            className="cell-muted"
            style={{ cursor: "help", borderBottom: "1px dashed var(--border)" }}
          >
            —
          </span>
        </HoverCardTrigger>
        <HoverCardContent>{unavailableHint}</HoverCardContent>
      </HoverCard>
    );
  }
  return <>{formatted}</>;
}
