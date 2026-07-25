import {
  OPERATIONS_CARD_HREF,
  OPERATIONS_CARD_LABEL,
  operationsCardSeverity,
} from "@/domain/operations/types";
import type { OperationsCard, OperationsCardKey } from "@/types/operations";

/** Turns the raw counts the service layer extracted from every module's
 * own dashboard query into the 15 Mission Control cards — labels, hrefs and
 * severity thresholds all live here, never in a component. */
export function buildOperationsCards(counts: Record<OperationsCardKey, number>): OperationsCard[] {
  return (Object.keys(counts) as OperationsCardKey[]).map((key) => ({
    key,
    label: OPERATIONS_CARD_LABEL[key],
    value: counts[key],
    severity: operationsCardSeverity(key, counts[key]),
    href: OPERATIONS_CARD_HREF[key],
  }));
}
