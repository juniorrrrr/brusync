"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Turnstile } from "@/components/materials/Turnstile";
import type { MaterialItem } from "@/data/materials";
import {
  applyClarityTags,
  describeOrigin,
  EVENTS,
  getTrackingContext,
  type TrackingContext,
  trackEvent,
} from "@/lib/tracking";
import { type MaterialLeadFormState, submitMaterialLead } from "@/services/materialLeads";

const initialState: MaterialLeadFormState = { status: "idle" };
const SUCCESS_DISPLAY_MS = 2600;

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function DownloadModal({
  material,
  source,
  open,
  onClose,
}: {
  material: MaterialItem;
  source: string;
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(submitMaterialLead, initialState);
  const [mounted, setMounted] = useState(false);
  const [leadStarted, setLeadStarted] = useState(false);
  const openedAtRef = useRef(0);
  const closedByDownloadRef = useRef(false);
  const downloadTriggeredRef = useRef(false);
  const contextRef = useRef<TrackingContext | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      openedAtRef.current = Date.now();
      closedByDownloadRef.current = false;
      downloadTriggeredRef.current = false;
      contextRef.current = getTrackingContext();
      setLeadStarted(false);
      applyClarityTags(contextRef.current.attribution, { material: material.slug });
      trackEvent(EVENTS.MATERIAL_MODAL_OPEN, {
        material_slug: material.slug,
        source,
        origin: describeOrigin(contextRef.current.attribution.lastTouch),
      });
    }
  }, [open, material.slug, source]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (state.status === "error" || state.status === "rejected") {
      trackEvent(EVENTS.MATERIAL_LEAD_REJECTED, {
        material_slug: material.slug,
        reason: state.status,
      });
    }
  }, [state.status, material.slug]);

  useEffect(() => {
    if (state.status !== "success" || !state.downloadUrl || downloadTriggeredRef.current) return;
    downloadTriggeredRef.current = true;

    const timeToConversionMs = Date.now() - openedAtRef.current;
    const origin = contextRef.current
      ? describeOrigin(contextRef.current.attribution.lastTouch)
      : "direto";
    trackEvent(EVENTS.MATERIAL_LEAD_SUBMIT, {
      material_slug: material.slug,
      source,
      time_to_conversion_ms: timeToConversionMs,
      origin,
    });
    trackEvent(EVENTS.GENERATE_LEAD, { source: "materiais", material_slug: material.slug });

    const timer = setTimeout(() => {
      trackEvent(EVENTS.MATERIAL_DOWNLOAD_START, { material_slug: material.slug });
      const link = document.createElement("a");
      link.href = state.downloadUrl as string;
      link.download = state.fileName ?? "";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.setTimeout(() => {
        trackEvent(EVENTS.MATERIAL_DOWNLOAD_COMPLETE, { material_slug: material.slug });
        closedByDownloadRef.current = true;
        onClose();
      }, 500);
    }, SUCCESS_DISPLAY_MS);

    return () => clearTimeout(timer);
    // `downloadTriggeredRef` makes this idempotent, so re-running on identity
    // changes of material/source/onClose is harmless.
  }, [state.status, state.downloadUrl, state.fileName, material.slug, source, onClose]);

  function handleClose() {
    if (!closedByDownloadRef.current && state.status !== "success") {
      trackEvent(EVENTS.MATERIAL_MODAL_CLOSE, { material_slug: material.slug, source });
    }
    onClose();
  }

  function handleFieldFocus() {
    if (!leadStarted) {
      setLeadStarted(true);
      trackEvent(EVENTS.MATERIAL_LEAD_START, { material_slug: material.slug, source });
    }
  }

  if (!mounted || !open) return null;

  const context = contextRef.current ?? getTrackingContext();

  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: overlay click-to-close is paired with a focusable/keyboard-operable close button inside the dialog
    // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard dismissal handled globally via the Escape key listener
    <div className="modal-overlay" onClick={handleClose}>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: onClick only stops the overlay's close-on-click from bubbling, it triggers no action itself */}
      <div
        className="modal-card"
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" aria-label="Fechar" onClick={handleClose}>
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="m18 6-12 12M6 6l12 12" />
          </svg>
        </button>

        {state.status === "success" ? (
          <div className="modal-success">
            <div className="modal-success-icon">
              <svg
                aria-hidden="true"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3>Tudo certo!</h3>
            <p>
              Seu download será iniciado automaticamente.
              <br />
              Também enviamos uma cópia para o seu e-mail.
            </p>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <span className="modal-eyebrow">Download gratuito</span>
              <h2 className="modal-title" id="download-modal-title">
                {material.title}
              </h2>
              <p className="modal-sub">
                Preencha seus dados para receber o material agora, direto no seu e-mail.
              </p>
            </div>

            <form className="lead-form modal-form" action={formAction}>
              <input type="hidden" name="materialSlug" value={material.slug} />
              <input type="hidden" name="source" value={source} />
              <input type="hidden" name="rendered_at" value={openedAtRef.current || Date.now()} />
              <input type="hidden" name="tracking_context" value={JSON.stringify(context)} />

              {/* Honeypot — campo invisível; bots costumam preencher todos os campos do formulário */}
              <div className="modal-honeypot" aria-hidden="true">
                <label htmlFor="company_site">Não preencha este campo</label>
                <input
                  type="text"
                  id="company_site"
                  name="company_site"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="lead-form-field">
                <label htmlFor="dl-name">Nome completo</label>
                <input
                  id="dl-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  onFocus={handleFieldFocus}
                />
              </div>
              <div className="lead-form-field">
                <label htmlFor="dl-email">E-mail</label>
                <input
                  id="dl-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  onFocus={handleFieldFocus}
                />
              </div>
              <div className="lead-form-field">
                <label htmlFor="dl-phone">Telefone / WhatsApp</label>
                <input
                  id="dl-phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  onFocus={handleFieldFocus}
                />
              </div>

              {turnstileSiteKey && <Turnstile siteKey={turnstileSiteKey} />}

              <button type="submit" className="btn btn-accent pulse-btn" disabled={pending}>
                {pending ? "Enviando..." : "Baixar material gratuitamente"}
                <span className="sweep" />
              </button>

              <p className="modal-disclaimer">
                Seu material será baixado automaticamente e também enviado para seu e-mail.
              </p>

              {(state.status === "error" || state.status === "rejected") && (
                <p className="lead-form-status error" role="status">
                  {state.message}
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
