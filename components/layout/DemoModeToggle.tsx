"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { setDemoModeAction } from "@/application/demo/demoModeActions";
import { DEMO_MODE_COOKIE, DEMO_MODE_STORAGE_KEY } from "@/lib/demo/constants";

function readCookieFlag(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((entry) => entry === `${DEMO_MODE_COOKIE}=1`);
}

/** Discreet header toggle between "Dados Reais" and "Modo Demonstração".
 * localStorage gives instant, flicker-free UI state on every page load;
 * the cookie is what actually drives which dataset Server Components read
 * (application/crm/*Queries.ts, application/marketingAnalytics/*) — flipping
 * it and calling router.refresh() re-fetches the current route through the
 * exact same query functions, so switching is instant with no logout and no
 * hard page reload. */
export function DemoModeToggle() {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect — router/startTransition identities don't need to re-trigger this resync.
  useEffect(() => {
    const stored = localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "1";
    setEnabled(stored);
    setMounted(true);

    // Resync the cookie with localStorage only if they've drifted (e.g. the
    // cookie expired or was cleared) — avoids an unnecessary refresh on
    // every normal page load when they already agree.
    if (readCookieFlag() !== stored) {
      startTransition(async () => {
        await setDemoModeAction(stored);
        router.refresh();
      });
    }
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, next ? "1" : "0");
    startTransition(async () => {
      await setDemoModeAction(next);
      router.refresh();
    });
  }

  if (!mounted) return <span className="crm-demo-toggle-placeholder" aria-hidden="true" />;

  return (
    <button
      type="button"
      className={`crm-demo-toggle${enabled ? " active" : ""}`}
      onClick={toggle}
      disabled={isPending}
      aria-pressed={enabled}
      title={
        enabled
          ? "Modo Demonstração ativo — dados fictícios, nada é salvo no banco"
          : "Ativar Modo Demonstração"
      }
    >
      <span className="crm-demo-toggle-dot" />
      {enabled ? "Modo Demonstração" : "Dados Reais"}
    </button>
  );
}
