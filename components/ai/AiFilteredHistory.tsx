"use client";

import { useMemo, useState } from "react";
import type { AiContextType, AiConversation } from "@/types/ai";

const PERIOD_OPTIONS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "all", label: "Todo o período" },
];

const CONTEXT_OPTIONS: { value: AiContextType | "all"; label: string }[] = [
  { value: "all", label: "Todos os contextos" },
  { value: "geral", label: "Geral" },
  { value: "lead", label: "Lead" },
  { value: "cliente", label: "Cliente" },
  { value: "projeto", label: "Projeto" },
  { value: "marketing", label: "Marketing" },
  { value: "comercial", label: "Comercial" },
  { value: "financeiro", label: "Financeiro" },
  { value: "projetos", label: "Projetos" },
];

/** Filtros do dashboard (Período/Responsável/Contexto) — aplicados no
 * cliente sobre a lista de conversas já carregada, mesmo espírito leve de
 * outros filtros client-side já usados no app (ex.: busca em
 * OperationsGlobalSearch). "Lead/Cliente/Projeto/Origem" da Fase 26 viram o
 * filtro de Contexto, que já cobre exatamente esses recortes
 * (ai_conversations.context_type). */
export function AiFilteredHistory({
  conversations,
  owners,
}: {
  conversations: AiConversation[];
  owners: { id: string; name: string | null; email: string | null }[];
}) {
  const [period, setPeriod] = useState("all");
  const [ownerId, setOwnerId] = useState("all");
  const [contextType, setContextType] = useState<AiContextType | "all">("all");

  const filtered = useMemo(() => {
    const now = Date.now();
    return conversations.filter((conversation) => {
      if (period !== "all") {
        const days = Number(period);
        const ageMs = now - new Date(conversation.updatedAt).getTime();
        if (ageMs > days * 24 * 60 * 60 * 1000) return false;
      }
      if (ownerId !== "all" && conversation.createdBy !== ownerId) return false;
      if (contextType !== "all" && conversation.contextType !== contextType) return false;
      return true;
    });
  }, [conversations, period, ownerId, contextType]);

  return (
    <div className="crm-card">
      <div className="crm-card-head">
        <div className="crm-card-title">Histórico</div>
        <div className="crm-ai-filter-bar">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="all">Todos os responsáveis</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name ?? owner.email}
              </option>
            ))}
          </select>
          <select
            value={contextType}
            onChange={(e) => setContextType(e.target.value as AiContextType | "all")}
          >
            {CONTEXT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="crm-card-pad">
        <div className="crm-mini-list">
          {filtered.map((conversation) => (
            <div key={conversation.id} className="crm-ai-history-row">
              <span>{conversation.title}</span>
              <span className="crm-card-sub">
                {new Date(conversation.updatedAt).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="crm-card-sub">Nenhuma conversa para este filtro.</p>
          )}
        </div>
      </div>
    </div>
  );
}
