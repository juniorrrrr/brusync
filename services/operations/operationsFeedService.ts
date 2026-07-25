import "server-only";

import {
  mapAutomationLogToFeedItem,
  mapConversionEventToFeedItem,
  mapInboundMessageToFeedItem,
  mapIntegrationEventToFeedItem,
  mapKnowledgeDocumentToFeedItem,
  mapPaidTransactionToFeedItem,
  mapProjectCompletedToFeedItem,
  mapProjectCreatedToFeedItem,
  mergeFeed,
} from "@/domain/operations/feed";
import type { OperationsData } from "@/services/operations/operationsDataService";
import type { OperationsFeedItem } from "@/types/operations";

const FEED_LIMIT = 30;
const TIMELINE_LIMIT = 100;

/** Feed and Timeline are the exact same merge (see domain/operations/feed's
 * mergeFeed) — Feed is just the newest slice, Timeline the fuller one. No
 * separate gathering pipeline, no separate sort, so there's no way for the
 * two views to ever disagree with each other. */
function buildMergedActivity(data: OperationsData): OperationsFeedItem[] {
  return mergeFeed(
    data.recentEvents.map(mapIntegrationEventToFeedItem),
    data.recentProjects.map(mapProjectCreatedToFeedItem),
    data.recentProjects.map(mapProjectCompletedToFeedItem),
    data.recentPaidTransactions.map((t) =>
      mapPaidTransactionToFeedItem({
        id: t.id,
        description: t.description,
        amount: t.amount,
        updatedAt: t.updatedAt,
        clientCompany: t.clientCompany,
      }),
    ),
    data.communication.map(mapInboundMessageToFeedItem),
    data.automationLogs.map(mapAutomationLogToFeedItem),
    data.knowledgeRecent.map(mapKnowledgeDocumentToFeedItem),
    data.recentConversions.map(mapConversionEventToFeedItem),
  );
}

export function computeOperationsFeed(data: OperationsData): OperationsFeedItem[] {
  return buildMergedActivity(data).slice(0, FEED_LIMIT);
}

export function computeOperationsTimeline(data: OperationsData): OperationsFeedItem[] {
  return buildMergedActivity(data).slice(0, TIMELINE_LIMIT);
}
