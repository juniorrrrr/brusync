"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { disconnectIntegrationAction } from "@/application/integrationsCenter/disconnectAction";

/** "Desconectar" — only rendered for providers currently "conectado" (see
 * IntegrationDrawer). Confirms inline before firing since it revokes real
 * tokens (services/metaAds/metaAdsAccountService.ts::disconnectMetaAdsAccount
 * for Meta Ads), same one-click-but-deliberate pattern as ActivateToggleButton. */
export function DisconnectButton({
  provider,
  className = "crm-ig-action-btn",
  onChanged,
}: {
  provider: string;
  className?: string;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    if (!window.confirm("Desconectar esta integração? Você poderá reconectar depois.")) return;
    setPending(true);
    const result = await disconnectIntegrationAction(provider);
    setMessage(result.message);
    setPending(false);
    router.refresh();
    onChanged?.();
  }

  return (
    <div>
      <button
        type="button"
        className={className}
        onClick={handleClick}
        disabled={pending}
        style={{ color: "var(--danger)" }}
      >
        {pending ? "Desconectando…" : "Desconectar"}
      </button>
      {message && <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>{message}</p>}
    </div>
  );
}
