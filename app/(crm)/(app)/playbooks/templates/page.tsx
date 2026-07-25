import type { Metadata } from "next";
import { fetchPlaybookTemplates } from "@/application/playbooks/playbooksQueries";
import { PLAYBOOK_CATEGORY_LABEL } from "@/domain/playbooks/statusMeta";

export const metadata: Metadata = {
  title: "Templates — Playbooks — Brusync OS",
};

export default async function PlaybookTemplatesPage() {
  const templates = await fetchPlaybookTemplates();

  return (
    <div className="crm-int-grid">
      {templates.map((template) => (
        <div key={template.id} className="crm-card crm-card-pad">
          <div className="crm-int-card-top">
            <div>
              <div className="crm-card-title">{template.name}</div>
              <div className="crm-card-sub">{PLAYBOOK_CATEGORY_LABEL[template.category]}</div>
            </div>
            {template.isDefault && <span className="crm-badge ok">Padrão</span>}
          </div>
          <p className="crm-card-sub" style={{ marginTop: 10 }}>
            {template.description}
          </p>
          <div className="crm-mini-list" style={{ marginTop: 10 }}>
            {template.stepsBlueprint.map((step) => (
              <div key={`${template.id}-${step.position}`} className="crm-mini-row">
                <span className="crm-mini-title">{step.title}</span>
                <span className="crm-mini-trail">{step.checklist.length} itens</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
