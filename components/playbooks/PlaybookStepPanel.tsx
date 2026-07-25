import {
  IconCalendar,
  IconCheckCircle,
  IconClock,
  IconMail,
  IconMessage,
  IconPhone,
} from "@/components/ui/icons";
import type { PlaybookStep } from "@/types/playbooks";

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="crm-mini-title">{title}</div>
      <ul className="crm-card-sub" style={{ marginTop: 6, paddingLeft: 18 }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function PlaybookStepPanel({ step }: { step: PlaybookStep }) {
  return (
    <div className="crm-card crm-card-pad">
      <div className="crm-int-card-top">
        <div>
          <div className="crm-card-title">{step.title}</div>
          <div className="crm-card-sub">{step.objective}</div>
        </div>
        <span className="crm-badge neutral">
          <IconClock size={13} /> {step.estimatedMinutes ?? "—"} min
        </span>
      </div>

      {step.description && <p className="crm-card-sub">{step.description}</p>}

      <div className="crm-mini-list" style={{ marginTop: 12 }}>
        {step.checklist.map((item) => (
          <div key={item} className="crm-mini-row">
            <IconCheckCircle size={15} />
            <span className="crm-mini-title">{item}</span>
          </div>
        ))}
      </div>

      <div className="crm-int-grid" style={{ marginTop: 16 }}>
        <ListBlock title="Scripts" items={step.scripts} />
        <ListBlock title="Boas práticas" items={step.bestPractices} />
        <ListBlock title="Erros comuns" items={step.commonMistakes} />
        <ListBlock title="Critérios de aprovação" items={step.approvalCriteria} />
        <ListBlock title="Critérios de reprovação" items={step.rejectionCriteria} />
        <div>
          <div className="crm-mini-title">Sugestões</div>
          <div className="crm-int-card-actions" style={{ marginTop: 8 }}>
            {step.suggestedActions.includes("ligacao") && (
              <button type="button" className="btn btn-outline">
                <IconPhone size={13} /> Ligação
              </button>
            )}
            {step.suggestedActions.includes("reuniao") && (
              <button type="button" className="btn btn-outline">
                <IconCalendar size={13} /> Reunião
              </button>
            )}
            {step.suggestedActions.includes("follow_up") && (
              <button type="button" className="btn btn-outline">
                <IconMessage size={13} /> Follow-up
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="crm-int-card-actions" style={{ marginTop: 16 }}>
        {step.communicationChannels.includes("whatsapp") && (
          <a className="btn btn-outline" href="https://wa.me/" target="_blank" rel="noreferrer">
            <IconPhone size={13} /> WhatsApp
          </a>
        )}
        {step.communicationChannels.includes("email") && (
          <a className="btn btn-outline" href="mailto:">
            <IconMail size={13} /> E-mail
          </a>
        )}
        {step.communicationChannels.includes("conversa") && (
          <a className="btn btn-outline" href="/comunicacao">
            <IconMessage size={13} /> Conversa
          </a>
        )}
      </div>

      {step.linkedDocuments.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="crm-mini-title">Base de Conhecimento vinculada</div>
          <div className="crm-mini-list" style={{ marginTop: 8 }}>
            {step.linkedDocuments.map((document) => (
              <a
                key={document.documentId}
                href={`/base-conhecimento/documentos/${document.documentId}`}
                className="crm-mini-row"
              >
                <span className="crm-mini-title">{document.title}</span>
                <span className="crm-mini-trail">{document.categoryName ?? "Documento"}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
