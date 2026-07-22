"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchJourneyData,
  type RecordJourneyEventState,
  recordJourneyEventAction,
} from "@/application/crm/journeyActions";
import { ProgressRing } from "@/components/crm/ProgressRing";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  IconCalendar,
  IconCheckCircle,
  IconReport,
  IconTarget,
  IconX,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatRelativeToNow } from "@/domain/crm/format";
import {
  JOURNEY_STAGE_EVENT_TYPE,
  JOURNEY_STAGE_LABEL,
  JOURNEY_STAGE_ORDER,
} from "@/domain/journey/stages";
import type {
  JourneyEvent,
  JourneyEventOrigin,
  JourneyStage,
  JourneySummary,
} from "@/types/journey";

const INITIAL_STATE: RecordJourneyEventState = { status: "idle" };

const ORIGIN_LABEL: Record<JourneyEventOrigin, string> = {
  manual: "Manual",
  automatico: "Automático",
  sistema: "Sistema",
};

const STAGE_ICON: Record<JourneyStage, typeof IconTarget> = {
  novo_lead: IconTarget,
  primeiro_contato: IconTarget,
  contato_realizado: IconTarget,
  lead_qualificado: IconCheckCircle,
  lead_desqualificado: IconX,
  reuniao_agendada: IconCalendar,
  diagnostico: IconReport,
  proposta_enviada: IconReport,
  negociacao: IconReport,
  venda_ganha: IconCheckCircle,
  venda_perdida: IconX,
  implantacao: IconCheckCircle,
  cliente_ativo: IconCheckCircle,
};

function msToLabel(ms: number | null): string {
  if (ms === null) return "—";
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) {
    const hours = Math.floor(ms / 3_600_000);
    if (hours <= 0) return "há poucos minutos";
    return `${hours}h`;
  }
  return days === 1 ? "1 dia" : `${days} dias`;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="crm-ws-row">
      <span className="crm-ws-row-label">{label}</span>
      <span className="crm-ws-row-value">{value}</span>
    </div>
  );
}

function JourneyEventRow({ event }: { event: JourneyEvent }) {
  const Icon = STAGE_ICON[event.stage];
  return (
    <div className="crm-tl-item">
      <span className="crm-tl-ico">
        <Icon size={15} />
      </span>
      <div>
        <div className="crm-tl-title">{JOURNEY_STAGE_LABEL[event.stage]}</div>
        <div className="crm-tl-meta">
          {formatDateTime(event.occurredAt)} · {event.actorName ?? "Sistema"} ·{" "}
          {ORIGIN_LABEL[event.origin]} · score {event.score}
        </div>
        {event.note && <div className="crm-tl-body">{event.note}</div>}
      </div>
    </div>
  );
}

export function JourneyTab({
  crmLeadId,
  refreshToken,
}: {
  crmLeadId: string;
  refreshToken: string;
}) {
  const [summary, setSummary] = useState<JourneySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<string>("");
  const [note, setNote] = useState("");
  const [formState, setFormState] = useState<RecordJourneyEventState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchJourneyData(crmLeadId).then((data) => {
      setSummary(data);
      setLoading(false);
    });
  }, [crmLeadId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshToken is an intentional cache-busting dependency, mirroring TimelineTab.
  useEffect(() => {
    load();
  }, [load, refreshToken]);

  async function handleSubmit() {
    if (!stage) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.set("crmLeadId", crmLeadId);
    formData.set("stage", stage);
    if (note.trim()) formData.set("note", note.trim());

    const result = await recordJourneyEventAction(INITIAL_STATE, formData);
    setFormState(result);
    setSubmitting(false);
    if (result.status === "success") {
      setStage("");
      setNote("");
      load();
    }
  }

  if (loading) {
    return (
      <div>
        <Skeleton style={{ height: 120, marginBottom: 16 }} />
        <Skeleton style={{ height: 90, marginBottom: 16 }} />
        <Skeleton style={{ height: 60 }} />
      </div>
    );
  }

  if (!summary) {
    return (
      <Empty>
        <EmptyMedia variant="icon">📈</EmptyMedia>
        <EmptyTitle>Jornada indisponível</EmptyTitle>
        <EmptyDescription>
          Não foi possível carregar a jornada comercial deste lead.
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div>
      <div className="crm-card crm-card-pad" style={{ marginBottom: 16 }}>
        <div className="crm-card-title">Jornada Comercial</div>
        <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 14 }}>
          <ProgressRing value={summary.score} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <StatRow
              label="Etapa atual"
              value={summary.currentStage ? JOURNEY_STAGE_LABEL[summary.currentStage] : "—"}
            />
            <StatRow label="Tempo na etapa" value={msToLabel(summary.timeInCurrentStageMs)} />
            <StatRow
              label="Tempo total desde a criação"
              value={msToLabel(summary.totalTimeSinceCreationMs)}
            />
            <StatRow label="Atividades" value={String(summary.activitiesCount)} />
            <StatRow label="Mudanças registradas" value={String(summary.changesCount)} />
            <StatRow label="Responsável" value={summary.ownerName ?? "Sem responsável"} />
            <StatRow
              label="Última movimentação"
              value={summary.lastMovementAt ? formatRelativeToNow(summary.lastMovementAt) : "—"}
            />
          </div>
        </div>
      </div>

      <div className="crm-ws-composer">
        <select
          className="crm-select"
          style={{ width: "100%" }}
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          aria-label="Nova etapa da jornada"
        >
          <option value="" disabled>
            Registrar etapa…
          </option>
          {JOURNEY_STAGE_ORDER.map((option) => (
            <option key={option} value={option}>
              {JOURNEY_STAGE_LABEL[option]}
              {JOURNEY_STAGE_EVENT_TYPE[option] ? " · notifica integrações" : ""}
            </option>
          ))}
        </select>
        <textarea
          placeholder="Observação opcional…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
        <div className="crm-composer-actions">
          <span className="crm-card-sub" style={{ margin: 0 }}>
            {formState.status === "error" && (
              <span style={{ color: "var(--danger)" }}>{formState.message}</span>
            )}
            {formState.status === "success" && (
              <span style={{ color: "#1fa971" }}>{formState.message}</span>
            )}
          </span>
          <button
            type="button"
            className="btn btn-accent"
            disabled={submitting || !stage}
            onClick={handleSubmit}
          >
            {submitting ? "Registrando…" : "Registrar evento"}
          </button>
        </div>
      </div>

      <div className="crm-card crm-card-pad" style={{ marginTop: 16 }}>
        <div className="crm-card-title" style={{ marginBottom: 4 }}>
          Linha do tempo da jornada
        </div>
        {summary.events.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">🧭</EmptyMedia>
            <EmptyTitle>Nenhum evento registrado ainda</EmptyTitle>
            <EmptyDescription>
              Cada etapa importante da jornada comercial deste lead aparecerá aqui.
            </EmptyDescription>
          </Empty>
        ) : (
          summary.events.map((event) => <JourneyEventRow key={event.id} event={event} />)
        )}
      </div>
    </div>
  );
}
