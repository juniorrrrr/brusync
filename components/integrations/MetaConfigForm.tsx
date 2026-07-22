"use client";

import { useActionState, useEffect, useState } from "react";
import {
  fetchMetaSettings,
  type MetaSettingsActionState,
  saveMetaSettingsAction,
  testMetaConnectionAction,
} from "@/application/metaConversionsApi/metaSettingsActions";
import { Switch } from "@/components/ui/switch";
import { CONVERSION_TYPE_LABEL } from "@/domain/conversions/types";
import { formatDateTime } from "@/domain/crm/format";
import { CONVERSION_TYPES_FOR_META } from "@/domain/metaConversionsApi/eventNames";
import type { MetaSettings } from "@/types/metaConversionsApi";

const INITIAL_STATE: MetaSettingsActionState = { status: "idle" };

export function MetaConfigForm() {
  const [settings, setSettings] = useState<MetaSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [formState, formAction] = useActionState(saveMetaSettingsAction, INITIAL_STATE);

  useEffect(() => {
    fetchMetaSettings().then((result) => {
      setSettings(result);
      setPixelId(result?.pixelId ?? "");
      setLoading(false);
    });
  }, []);

  async function handleTest() {
    setTesting(true);
    setTestResult(await testMetaConnectionAction(pixelId, accessToken));
    setTesting(false);
  }

  if (loading) return <p className="crm-ig-desc">Carregando…</p>;
  if (!settings) return <p className="crm-ig-desc">Integração Meta Ads não encontrada.</p>;

  return (
    <form action={formAction} className="crm-ig-drawer-body">
      <div className="crm-ig-field">
        <label htmlFor="meta-pixel-id">Meta Pixel ID</label>
        <input
          id="meta-pixel-id"
          name="pixelId"
          className="crm-select"
          style={{ width: "100%" }}
          value={pixelId}
          onChange={(e) => setPixelId(e.target.value)}
          placeholder="123456789012345"
        />
      </div>

      <div className="crm-ig-field">
        <label htmlFor="meta-token">
          Access Token{" "}
          {settings.hasAccessToken ? "(configurado — deixe em branco para manter)" : ""}
        </label>
        <input
          id="meta-token"
          name="accessToken"
          type="password"
          autoComplete="off"
          className="crm-select"
          style={{ width: "100%" }}
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder={
            settings.hasAccessToken ? "•••••••••••• (salvo)" : "Cole o Access Token do sistema"
          }
        />
      </div>

      <div className="crm-ig-field">
        <label htmlFor="meta-test-code">Test Event Code</label>
        <input
          id="meta-test-code"
          name="testEventCode"
          className="crm-select"
          style={{ width: "100%" }}
          defaultValue={settings.testEventCode}
          placeholder="TEST12345 (opcional — Meta Events Manager)"
        />
      </div>

      <div className="crm-ig-field">
        <label htmlFor="meta-enabled-toggle">Ativada</label>
        <label
          htmlFor="meta-enabled-toggle"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <Switch id="meta-enabled-toggle" name="enabled" defaultChecked={settings.enabled} />
          <span className="crm-card-sub" style={{ margin: 0 }}>
            Enviar eventos automaticamente conforme a jornada do lead
          </span>
        </label>
      </div>

      <div className="crm-ig-field">
        <span className="crm-ig-field-label">Última sincronização</span>
        <span>{settings.lastSync ? formatDateTime(settings.lastSync) : "—"}</span>
      </div>
      {settings.error && (
        <div className="crm-ig-field">
          <span className="crm-ig-field-label">Último erro</span>
          <span style={{ color: "var(--danger)" }}>{settings.error}</span>
        </div>
      )}

      <div>
        <div className="crm-card-title" style={{ marginBottom: 8 }}>
          Eventos enviados
        </div>
        {CONVERSION_TYPES_FOR_META.map((type) => (
          <label
            key={type}
            htmlFor={`meta-event-${type}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 0",
            }}
          >
            <span className="crm-card-sub" style={{ margin: 0 }}>
              {CONVERSION_TYPE_LABEL[type]}
            </span>
            <Switch
              id={`meta-event-${type}`}
              name={`event_${type}`}
              defaultChecked={settings.eventsEnabled[type]}
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        className="crm-ig-action-btn"
        onClick={handleTest}
        disabled={testing || !pixelId}
      >
        {testing ? "Testando…" : "Testar conexão"}
      </button>
      {testResult && (
        <p style={{ color: testResult.ok ? "#1fa971" : "var(--danger)", fontSize: 13 }}>
          {testResult.message}
        </p>
      )}

      {formState.status === "error" && (
        <p style={{ color: "var(--danger)", fontSize: 13 }}>{formState.message}</p>
      )}
      {formState.status === "success" && (
        <p style={{ color: "#1fa971", fontSize: 13 }}>{formState.message}</p>
      )}

      <button type="submit" className="crm-ig-action-btn">
        Salvar
      </button>

      <a href="/integracoes/meta" className="crm-ig-action-btn" style={{ textAlign: "center" }}>
        Ver painel completo da Meta →
      </a>
    </form>
  );
}
