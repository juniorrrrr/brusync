"use client";

import { useState } from "react";
import { selectIntegrationEntityAction } from "@/application/integrationsCenter/selectEntityAction";
import type { IntegrationSelectableEntity } from "@/domain/integrations/provider";

/** "Escolha da conta/organização" (Fase 35) — Google Ads, GA4, GTM e Search
 * Console não têm página própria (a fase proíbe criar uma), então esta é a
 * única superfície onde o usuário decide qual conta/propriedade/container/
 * site sincronizar depois de concluir o OAuth. Renderizado pelo Drawer no
 * lugar do formulário genérico de notas enquanto
 * IntegrationProvider.needsEntitySelection() for true. */
export function GoogleEntityPicker({
  provider,
  entities,
  onSelected,
}: {
  provider: string;
  entities: IntegrationSelectableEntity[];
  onSelected?: () => void;
}) {
  const [selecting, setSelecting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSelect(entityId: string) {
    setSelecting(entityId);
    setMessage(null);
    const result = await selectIntegrationEntityAction(provider, entityId);
    setMessage({ ok: result.ok, text: result.message });
    setSelecting(null);
    if (result.ok) onSelected?.();
  }

  if (entities.length === 0) {
    return (
      <p className="crm-ig-desc">
        Conta conectada, mas nenhuma conta/propriedade acessível foi encontrada — verifique as
        permissões da conta Google usada para conectar.
      </p>
    );
  }

  return (
    <div>
      <p className="crm-ig-desc" style={{ marginBottom: 10 }}>
        Escolha qual conta sincronizar:
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {entities.map((entity) => (
          <button
            key={entity.id}
            type="button"
            className="crm-ig-action-btn"
            style={{
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              alignItems: "flex-start",
            }}
            disabled={selecting !== null}
            onClick={() => handleSelect(entity.id)}
          >
            <span style={{ fontWeight: 700 }}>
              {selecting === entity.id ? "Selecionando…" : entity.label}
            </span>
            {entity.meta && (
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{entity.meta}</span>
            )}
          </button>
        ))}
      </div>
      {message && (
        <p style={{ color: message.ok ? "#1fa971" : "var(--danger)", fontSize: 12, marginTop: 8 }}>
          {message.text}
        </p>
      )}
    </div>
  );
}
