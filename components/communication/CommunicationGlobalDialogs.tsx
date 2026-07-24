"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NewConversationDialog } from "@/components/communication/NewConversationDialog";
import type { Channel } from "@/types/communication";
import type { OwnerRef } from "@/types/crm";

/** Mounted once at the CRM shell (mirrors FinancialGlobalDialogs, Fase 14) —
 * reachable from the Central de Comunicação, the Lead Workspace's
 * "Comunicação" tab and the Client Drawer's "Comunicação" section. */
export function CommunicationGlobalDialogs({
  channels,
  owners,
}: {
  channels: Channel[];
  owners: OwnerRef[];
}) {
  const router = useRouter();
  const [createdConversationId, setCreatedConversationId] = useState<string | null>(null);

  // Navigating from a plain effect (rather than directly inside the dialog's
  // onCreated callback, which fires from within useActionState's own
  // transition) avoids a Next.js router.push that gets silently swallowed
  // when called across a Lead Workspace/Client Drawer route that isn't
  // /comunicacao itself.
  useEffect(() => {
    if (!createdConversationId) return;
    router.push(`/comunicacao?conversationId=${createdConversationId}`);
    setCreatedConversationId(null);
  }, [createdConversationId, router]);

  return (
    <NewConversationDialog
      channels={channels}
      owners={owners}
      onCreated={setCreatedConversationId}
    />
  );
}
