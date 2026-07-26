"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { searchLeadsAction } from "@/application/crm/leadsActions";
import { searchClientsAction } from "@/application/projects/projectsActions";
import { assignWhatsappLabelsAction } from "@/application/whatsapp/whatsappChatActions";
import {
  linkWhatsappConversationToClientAction,
  linkWhatsappConversationToLeadAction,
  linkWhatsappConversationToProjectAction,
  searchProjectsForWhatsappAction,
} from "@/application/whatsapp/whatsappCrmLinkActions";
import { WhatsappAgendaActions } from "@/components/whatsapp/WhatsappAgendaActions";
import type { ClientWithOwner, CrmLead } from "@/types/crm";
import type { Project } from "@/types/projects";
import type { WhatsappConversationDetail, WhatsappLabel } from "@/types/whatsapp";

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="crm-info-row">
      <span className="crm-info-row-label">{label}</span>
      <span className="crm-info-row-value">{value}</span>
    </div>
  );
}

function LeadPicker({ conversation }: { conversation: WhatsappConversationDetail }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CrmLead[]>([]);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function search() {
    startTransition(async () => {
      setResults((await searchLeadsAction(query)) as CrmLead[]);
    });
  }

  function link(leadId: string) {
    startTransition(async () => {
      await linkWhatsappConversationToLeadAction(conversation.id, conversation.contact.id, leadId);
      router.refresh();
    });
  }

  return (
    <div className="crm-composer-row">
      <input placeholder="Buscar lead…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <button type="button" className="btn btn-outline" onClick={search} disabled={isPending}>
        Buscar
      </button>
      {results.length > 0 && (
        <div className="crm-mini-list" style={{ width: "100%" }}>
          {results.slice(0, 5).map((lead) => (
            <button
              key={lead.id}
              type="button"
              className="crm-an-row"
              style={{
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => link(lead.id)}
            >
              {lead.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientPicker({ conversation }: { conversation: WhatsappConversationDetail }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientWithOwner[]>([]);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function search() {
    startTransition(async () => {
      setResults(await searchClientsAction(query));
    });
  }

  function link(clientId: string) {
    startTransition(async () => {
      await linkWhatsappConversationToClientAction(
        conversation.id,
        conversation.contact.id,
        clientId,
      );
      router.refresh();
    });
  }

  return (
    <div className="crm-composer-row">
      <input
        placeholder="Buscar cliente…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="button" className="btn btn-outline" onClick={search} disabled={isPending}>
        Buscar
      </button>
      {results.length > 0 && (
        <div className="crm-mini-list" style={{ width: "100%" }}>
          {results.slice(0, 5).map((client) => (
            <button
              key={client.id}
              type="button"
              className="crm-an-row"
              style={{
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => link(client.id)}
            >
              {client.company}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectPicker({ conversation }: { conversation: WhatsappConversationDetail }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Project[]>([]);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function search() {
    startTransition(async () => {
      setResults(await searchProjectsForWhatsappAction(query));
    });
  }

  function link(projectId: string) {
    startTransition(async () => {
      await linkWhatsappConversationToProjectAction(conversation.id, projectId);
      router.refresh();
    });
  }

  return (
    <div className="crm-composer-row">
      <input
        placeholder="Buscar projeto…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="button" className="btn btn-outline" onClick={search} disabled={isPending}>
        Buscar
      </button>
      {results.length > 0 && (
        <div className="crm-mini-list" style={{ width: "100%" }}>
          {results.slice(0, 5).map((project) => (
            <button
              key={project.id}
              type="button"
              className="crm-an-row"
              style={{
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => link(project.id)}
            >
              {project.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LabelsPicker({
  conversation,
  labels,
}: {
  conversation: WhatsappConversationDetail;
  labels: WhatsappLabel[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const selected = new Set(conversation.labels.map((l) => l.id));

  function toggle(labelId: string) {
    const next = selected.has(labelId)
      ? conversation.labels.filter((l) => l.id !== labelId).map((l) => l.id)
      : [...conversation.labels.map((l) => l.id), labelId];
    startTransition(async () => {
      await assignWhatsappLabelsAction(conversation.id, next);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {labels.map((label) => (
        <button
          key={label.id}
          type="button"
          className={`crm-badge ${selected.has(label.id) ? "info" : "neutral"}`}
          disabled={isPending}
          onClick={() => toggle(label.id)}
          style={{ cursor: "pointer", border: "none" }}
        >
          {label.name}
        </button>
      ))}
    </div>
  );
}

export function WhatsappConversationInfoPanel({
  conversation,
  labels,
}: {
  conversation: WhatsappConversationDetail | null;
  labels: WhatsappLabel[];
}) {
  if (!conversation) return <div className="crm-comm-pane crm-comm-info-pane" />;

  return (
    <div className="crm-comm-pane crm-comm-info-pane">
      <div className="crm-comm-pane-head">
        <span className="crm-drawer-section-title" style={{ marginBottom: 0 }}>
          Informações
        </span>
      </div>

      <div className="crm-comm-info-scroll">
        <div className="crm-drawer-section-title" style={{ marginTop: 0 }}>
          Contato
        </div>
        <div className="crm-info-list">
          <Row label="Nome" value={conversation.contact.profileName} />
          <Row label="Telefone" value={conversation.contact.phoneNumber} />
        </div>

        <div className="crm-drawer-section-title">Etiquetas</div>
        <LabelsPicker conversation={conversation} labels={labels} />

        <div className="crm-drawer-section-title">Lead</div>
        {conversation.crmLeadName ? (
          <div className="crm-info-list">
            <Row label="Lead vinculado" value={conversation.crmLeadName} />
          </div>
        ) : (
          <LeadPicker conversation={conversation} />
        )}

        <div className="crm-drawer-section-title">Cliente</div>
        {conversation.clientCompany ? (
          <div className="crm-info-list">
            <Row label="Cliente vinculado" value={conversation.clientCompany} />
          </div>
        ) : (
          <ClientPicker conversation={conversation} />
        )}

        <div className="crm-drawer-section-title">Projeto</div>
        {conversation.projectName ? (
          <div className="crm-info-list">
            <Row label="Projeto vinculado" value={conversation.projectName} />
          </div>
        ) : (
          <ProjectPicker conversation={conversation} />
        )}

        <div className="crm-drawer-section-title">Agenda</div>
        <WhatsappAgendaActions crmLeadId={conversation.crmLeadId} />
      </div>
    </div>
  );
}
