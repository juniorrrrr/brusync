"use client";

import { useState } from "react";
import { testIntegrationConnectionAction } from "@/application/integrationsCenter/testConnectionAction";

/** Shared "Testar conexão" button — used on both the catalog card (quick
 * test) and inside the Drawer. Always shows exactly what the server
 * returned, including the honest "not implemented yet" message for every
 * provider without a real integration — never renders a fabricated success
 * state on its own. */
export function TestConnectionButton({
  provider,
  className = "crm-ig-action-btn",
  onChanged,
}: {
  provider: string;
  className?: string;
  /** Called after the test completes (regardless of outcome) — lets a
   * caller holding its own client-fetched copy of the integration (e.g. the
   * Drawer's History list) refetch, since this action's log write wouldn't
   * otherwise be reflected there. */
  onChanged?: () => void;
}) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleClick() {
    setTesting(true);
    setResult(null);
    const outcome = await testIntegrationConnectionAction(provider);
    setResult(outcome);
    setTesting(false);
    onChanged?.();
  }

  return (
    <div>
      <button type="button" className={className} onClick={handleClick} disabled={testing}>
        {testing ? "Testando…" : "Testar conexão"}
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
