"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { triggerManualSyncAction } from "@/application/metaAds/metaAdsSyncActions";

export function useMetaAdsSync(accountId: string) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function sync() {
    startTransition(async () => {
      const result = await triggerManualSyncAction(accountId);
      setMessage({ ok: result.status === "success", text: result.message ?? "" });
      router.refresh();
    });
  }

  return { sync, isPending, message };
}
