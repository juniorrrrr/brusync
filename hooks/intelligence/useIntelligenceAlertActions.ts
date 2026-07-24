"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  acknowledgeIntelligenceAlertAction,
  resolveIntelligenceAlertAction,
} from "@/application/intelligence/intelligenceAlertsActions";

/** Acknowledge/resolve mutations shared by every alert card — refreshes the
 * server-rendered dashboard afterwards so the alert list reflects the new
 * status without a full page reload. */
export function useIntelligenceAlertActions() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function acknowledge(id: string) {
    startTransition(async () => {
      await acknowledgeIntelligenceAlertAction(id);
      router.refresh();
    });
  }

  function resolve(id: string) {
    startTransition(async () => {
      await resolveIntelligenceAlertAction(id);
      router.refresh();
    });
  }

  return { acknowledge, resolve, isPending };
}
