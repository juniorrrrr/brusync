import type { ReactNode } from "react";
import { fetchTeamMembersPageData } from "@/application/team/teamQueries";
import { TeamCheckinSchedulerModal } from "@/components/team/TeamCheckinSchedulerModal";
import { TeamFeedbackComposerModal } from "@/components/team/TeamFeedbackComposerModal";
import { TeamGoalEditorModal } from "@/components/team/TeamGoalEditorModal";
import { TeamSubNav } from "@/components/team/TeamSubNav";
import { TeamCheckinSchedulerProvider } from "@/contexts/team/TeamCheckinSchedulerContext";
import { TeamFeedbackComposerProvider } from "@/contexts/team/TeamFeedbackComposerContext";
import { TeamGoalEditorProvider } from "@/contexts/team/TeamGoalEditorContext";
import "@/styles/team.css";

/** Providers/Modais moram aqui (não só em /equipe/metas ou /equipe/feedback)
 * porque TeamMemberProfileClient — usado em Colaboradores e Individual —
 * também abre o composer de feedback e o agendador de check-in; mesmo
 * padrão de GoalEditorProvider montado no layout de /performance para cobrir
 * toda a árvore de rotas do módulo. */
export default async function EquipeLayout({ children }: { children: ReactNode }) {
  const { members } = await fetchTeamMembersPageData();
  const memberOptions = members.map((m) => ({ id: m.id, name: m.name ?? m.email }));

  return (
    <TeamGoalEditorProvider>
      <TeamFeedbackComposerProvider>
        <TeamCheckinSchedulerProvider>
          <div>
            <div className="crm-page-head">
              <div>
                <h1 className="crm-page-title">Equipe</h1>
                <p className="crm-page-sub">
                  Painel operacional da equipe — colaboradores, metas, feedback e check-ins, usando
                  os dados já existentes de CRM, Projetos, Financeiro e Agenda.
                </p>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <TeamSubNav />
            </div>

            {children}
          </div>

          <TeamGoalEditorModal members={memberOptions} />
          <TeamFeedbackComposerModal members={memberOptions} />
          <TeamCheckinSchedulerModal members={memberOptions} />
        </TeamCheckinSchedulerProvider>
      </TeamFeedbackComposerProvider>
    </TeamGoalEditorProvider>
  );
}
