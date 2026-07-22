import type { ConversionDeliveryAttempt, ConversionType } from "@/types/conversions";
import type { Integration } from "@/types/integrations";

export interface MetaSettings {
  pixelId: string;
  testEventCode: string;
  hasAccessToken: boolean;
  enabled: boolean;
  eventsEnabled: Record<ConversionType, boolean>;
  status: string;
  error: string | null;
  healthScore: number | null;
  lastSync: string | null;
  connectedAt: string | null;
}

export interface MetaHealthData {
  integration: Integration | null;
  pendingCount: number;
  sentCount: number;
  errorCount: number;
  successRate: number | null;
  fieldCoveragePercent: number | null;
  lastSentAt: string | null;
  recentFailures: {
    id: string;
    leadName: string | null;
    message: string | null;
    createdAt: string;
  }[];
}

export interface LeadMetaEvent {
  deliveryId: string;
  conversionType: ConversionType;
  occurredAt: string;
  status: string;
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
  pixelId: string | null;
  latestAttempt: ConversionDeliveryAttempt | null;
}
