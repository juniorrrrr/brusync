"use client";

import { useState, useTransition } from "react";
import { toggleWhatsappAutomationAction } from "@/application/whatsapp/whatsappAutomationsActions";

export function useWhatsappAutomationToggle(automationId: string, initialActive: boolean) {
  const [active, setActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !active;
    setActive(next);
    startTransition(async () => {
      const result = await toggleWhatsappAutomationAction(automationId, next);
      if (result.status !== "success") setActive(!next);
    });
  }

  return { active, toggle, isPending };
}
