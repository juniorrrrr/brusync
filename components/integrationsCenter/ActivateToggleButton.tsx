"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleIntegrationEnabledAction } from "@/application/integrationsCenter/toggleEnabledAction";

/** Shared "Ativar/Desativar" button — used on both the catalog card and the
 * Drawer, standalone from the credentials "Salvar" form so toggling doesn't
 * require opening the full config form. */
export function ActivateToggleButton({
  provider,
  enabled,
  className = "crm-ig-action-btn",
  onChanged,
}: {
  provider: string;
  enabled: boolean;
  className?: string;
  /** Called after the toggle completes — lets a caller holding its own
   * client-fetched copy of the integration (e.g. the Drawer's History list)
   * refetch, since router.refresh() alone only re-renders the Server
   * Component behind it, never this kind of local client state. */
  onChanged?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    await toggleIntegrationEnabledAction(provider, !enabled);
    setPending(false);
    router.refresh();
    onChanged?.();
  }

  return (
    <button type="button" className={className} onClick={handleClick} disabled={pending}>
      {pending ? "Salvando…" : enabled ? "Desativar" : "Ativar"}
    </button>
  );
}
