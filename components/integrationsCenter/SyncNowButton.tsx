"use client";

import { useState } from "react";
import { syncIntegrationNowAction } from "@/application/integrationsCenter/syncNowAction";

/** Shared "Sincronizar agora" button — used on both the catalog card and
 * inside the Drawer, same pattern as TestConnectionButton. Always shows
 * exactly what the server returned, including the honest "not implemented
 * yet" message for every provider without a real sync engine. */
export function SyncNowButton({
  provider,
  className = "crm-ig-action-btn",
  onChanged,
}: {
  provider: string;
  className?: string;
  onChanged?: () => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleClick() {
    setSyncing(true);
    setResult(null);
    const outcome = await syncIntegrationNowAction(provider);
    setResult(outcome);
    setSyncing(false);
    onChanged?.();
  }

  return (
    <div>
      <button type="button" className={className} onClick={handleClick} disabled={syncing}>
        {syncing ? "Sincronizando…" : "Sincronizar agora"}
      </button>
      {result && (
        <p
          style={{
            color: result.ok ? "#1fa971" : "var(--muted)",
            fontSize: 12,
            marginTop: 6,
          }}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
