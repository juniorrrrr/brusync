"use client";

import { KpiCard } from "@/components/dashboard/KpiCard";
import { TeamCheckinList } from "@/components/team/TeamCheckinList";
import { TeamFeedbackList } from "@/components/team/TeamFeedbackList";
import { TeamGoalCard } from "@/components/team/TeamGoalCard";
import { TeamMemberAvatar } from "@/components/team/TeamMemberAvatar";
import { TeamTimeOffForm } from "@/components/team/TeamTimeOffForm";
import {
  IconCalendar,
  IconCheckCircle,
  IconMail,
  IconMessage,
  IconPhone,
  IconStar,
  IconTarget,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";
import { useTeamCheckinScheduler } from "@/contexts/team/TeamCheckinSchedulerContext";
import { useTeamFeedbackComposer } from "@/contexts/team/TeamFeedbackComposerContext";
import { isAchieved } from "@/domain/performance/scoring";
import {
  MEMBER_STATUS_BADGE,
  MEMBER_STATUS_LABEL,
  TIME_OFF_STATUS_BADGE,
  TIME_OFF_STATUS_LABEL,
  TIME_OFF_TYPE_LABEL,
} from "@/domain/team/statusMeta";
import type { TeamMemberProfileData } from "@/types/team";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string): string {
  return iso.slice(0, 10).split("-").reverse().join("/");
}

export function TeamMemberProfileClient({ profile }: { profile: TeamMemberProfileData }) {
  const { member, metrics, goals, feedbacks, checkins, timeOff } = profile;
  const { openFor: openFeedback } = useTeamFeedbackComposer();
  const { openFor: openCheckin } = useTeamCheckinScheduler();

  const achievements = goals.filter((g) => isAchieved(g.progressStatus));
  const recognitions = feedbacks.filter((f) => f.type === "elogio" || f.type === "reconhecimento");

  const timeline = [
    ...feedbacks.map((f) => ({ date: f.createdAt, label: `Feedback: ${f.comment}` })),
    ...checkins.map((c) => ({ date: c.scheduledAt, label: `Check-in agendado (${c.type})` })),
    ...timeOff.map((t) => ({
      date: t.startDate,
      label: `Ausência: ${TIME_OFF_TYPE_LABEL[t.type]}`,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 10);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="crm-card crm-card-pad">
        <div className="crm-team-card-top">
          <TeamMemberAvatar name={member.name} photoUrl={member.photoUrl} size={64} />
          <div>
            <h2 style={{ margin: 0 }}>{member.name ?? member.email}</h2>
            <p className="crm-card-sub">
              {member.roleName ?? "Sem cargo"} · {member.department ?? "Sem departamento"}
            </p>
            <div className="crm-proc-card-meta">
              <span className={`crm-badge ${MEMBER_STATUS_BADGE[member.status]}`}>
                {MEMBER_STATUS_LABEL[member.status]}
              </span>
              {member.entryDate && <span>Desde {formatDate(member.entryDate)}</span>}
              {member.supervisorName && <span>Supervisor: {member.supervisorName}</span>}
              {member.email && (
                <span>
                  <IconMail size={12} /> {member.email}
                </span>
              )}
              {member.phone && (
                <span>
                  <IconPhone size={12} /> {member.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="crm-modal-actions" style={{ justifyContent: "flex-start", marginTop: 12 }}>
          <button type="button" className="btn btn-outline" onClick={() => openFeedback(member.id)}>
            <IconMessage size={13} /> Novo feedback
          </button>
          <button type="button" className="btn btn-outline" onClick={() => openCheckin(member.id)}>
            <IconCalendar size={13} /> Agendar check-in
          </button>
        </div>
      </div>

      <div className="crm-kpi-grid">
        <KpiCard label="Leads" value={metrics.leadsCount} icon={IconTarget} />
        <KpiCard label="Clientes" value={metrics.clientsCount} icon={IconUsers} />
        <KpiCard label="Projetos" value={metrics.projectsCount} icon={IconCheckCircle} />
        <KpiCard label="Receita" value={formatCurrency(metrics.revenue)} icon={IconWallet} />
        <KpiCard
          label="Conversão"
          value={metrics.conversionRate !== null ? `${metrics.conversionRate.toFixed(1)}%` : "—"}
          icon={IconStar}
        />
      </div>

      <div className="crm-card">
        <div className="crm-card-head">
          <div className="crm-card-title">Metas ativas</div>
        </div>
        <div className="crm-card-pad">
          <div className="crm-int-grid">
            {goals.map((goal) => (
              <TeamGoalCard key={goal.id} goal={goal} />
            ))}
            {goals.length === 0 && <p className="crm-card-sub">Nenhuma meta ativa.</p>}
          </div>
        </div>
      </div>

      <div className="crm-card">
        <div className="crm-card-head">
          <div className="crm-card-title">Conquistas</div>
        </div>
        <div className="crm-card-pad">
          <div className="crm-mini-list">
            {achievements.map((g) => (
              <div key={g.id} className="crm-team-breakdown-row">
                <span>Meta de {g.type} atingida</span>
                <span className="crm-badge ok">
                  {g.percentComplete !== null ? `${g.percentComplete.toFixed(0)}%` : "—"}
                </span>
              </div>
            ))}
            {recognitions.map((f) => (
              <div key={f.id} className="crm-team-breakdown-row">
                <span>{f.comment}</span>
                <span className="crm-badge ok">Reconhecimento</span>
              </div>
            ))}
            {achievements.length === 0 && recognitions.length === 0 && (
              <p className="crm-card-sub">Nenhuma conquista registrada ainda.</p>
            )}
          </div>
        </div>
      </div>

      <div className="crm-card">
        <div className="crm-card-head">
          <div className="crm-card-title">Timeline</div>
        </div>
        <div className="crm-card-pad">
          <div className="crm-mini-list">
            {timeline.map((item) => (
              <div key={`${item.date}-${item.label}`} className="crm-team-breakdown-row">
                <span>{item.label}</span>
                <span className="crm-card-sub">{formatDate(item.date)}</span>
              </div>
            ))}
            {timeline.length === 0 && <p className="crm-card-sub">Nenhum evento recente.</p>}
          </div>
        </div>
      </div>

      <div className="crm-card">
        <div className="crm-card-head">
          <div className="crm-card-title">Feedback recebido</div>
        </div>
        <div className="crm-card-pad">
          <TeamFeedbackList feedbacks={feedbacks} />
        </div>
      </div>

      <div className="crm-card">
        <div className="crm-card-head">
          <div className="crm-card-title">Check-ins</div>
        </div>
        <div className="crm-card-pad">
          <TeamCheckinList checkins={checkins} />
        </div>
      </div>

      <div className="crm-card">
        <div className="crm-card-head">
          <div className="crm-card-title">Ausências</div>
        </div>
        <div className="crm-card-pad">
          <TeamTimeOffForm teamMemberId={member.id} />
          <div className="crm-mini-list" style={{ marginTop: 12 }}>
            {timeOff.map((t) => (
              <div key={t.id} className="crm-team-breakdown-row">
                <span>
                  {TIME_OFF_TYPE_LABEL[t.type]} · {formatDate(t.startDate)} –{" "}
                  {formatDate(t.endDate)}
                </span>
                <span className={`crm-badge ${TIME_OFF_STATUS_BADGE[t.status]}`}>
                  {TIME_OFF_STATUS_LABEL[t.status]}
                </span>
              </div>
            ))}
            {timeOff.length === 0 && <p className="crm-card-sub">Nenhuma ausência registrada.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
