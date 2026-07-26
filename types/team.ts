import type { GoalDirection, GoalProgressStatus } from "@/types/performance";

/** Re-exported instead of redefined — "atingida/superada/no_prazo/em_risco/
 * abaixo_50" e "maior_melhor/menor_melhor" são exatamente os mesmos conceitos
 * já usados por performance_goals (Fase 23); metas de equipe reaproveitam as
 * funções puras de domain/performance/scoring.ts tal qual. */
export type { GoalDirection, GoalProgressStatus };

export type TeamMemberStatus = "ativo" | "ferias" | "afastado" | "inativo";

export interface TeamRole {
  id: string;
  name: string;
  department: string | null;
  description: string | null;
  createdAt: string;
}

/** Extensão de profiles (id, name, email, role de acesso) — nunca duplica
 * esses campos, só agrega o que não existe em lugar nenhum do schema:
 * foto, cargo, departamento, data de entrada, status operacional, contato,
 * supervisor. */
export interface TeamMember {
  id: string;
  profileId: string;
  name: string | null;
  email: string | null;
  accessRole: "administrador" | "gestor" | "comercial" | "atendimento" | "cliente";
  photoUrl: string | null;
  roleId: string | null;
  roleName: string | null;
  department: string | null;
  entryDate: string | null;
  status: TeamMemberStatus;
  phone: string | null;
  supervisorId: string | null;
  supervisorName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TeamGoalType =
  | "receita"
  | "leads"
  | "conversao"
  | "projetos"
  | "clientes"
  | "atividades"
  | "tempo_resposta";

export type TeamGoalPeriodType = "mensal" | "trimestral" | "anual";
export type TeamGoalStatus = "ativa" | "arquivada";

export interface TeamGoal {
  id: string;
  teamMemberId: string;
  type: TeamGoalType;
  periodType: TeamGoalPeriodType;
  periodStart: string;
  periodEnd: string;
  targetValue: number;
  direction: GoalDirection;
  status: TeamGoalStatus;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamGoalProgressPoint {
  id: string;
  goalId: string;
  recordedAt: string;
  actualValue: number | null;
  percentComplete: number | null;
  note: string | null;
}

export interface TeamGoalWithProgress extends TeamGoal {
  memberName: string | null;
  actualValue: number | null;
  percentComplete: number | null;
  progressStatus: GoalProgressStatus | null;
  history: TeamGoalProgressPoint[];
}

export type TeamFeedbackType = "elogio" | "construtivo" | "alerta" | "reconhecimento";
export type TeamFeedbackStatus = "aberto" | "reconhecido" | "arquivado";

export interface TeamFeedback {
  id: string;
  authorId: string | null;
  authorName: string | null;
  recipientTeamMemberId: string;
  recipientName: string | null;
  type: TeamFeedbackType;
  comment: string;
  status: TeamFeedbackStatus;
  createdAt: string;
  updatedAt: string;
}

export type TeamCheckinType = "1_1" | "reuniao" | "avaliacao" | "alinhamento";
export type TeamCheckinStatus = "agendado" | "realizado" | "cancelado";

export interface TeamCheckin {
  id: string;
  teamMemberId: string;
  memberName: string | null;
  authorId: string | null;
  authorName: string | null;
  type: TeamCheckinType;
  scheduledAt: string;
  notes: string | null;
  status: TeamCheckinStatus;
  createdAt: string;
  updatedAt: string;
}

export type TeamTimeOffType = "ferias" | "licenca" | "folga" | "atestado";
export type TeamTimeOffStatus = "solicitado" | "aprovado" | "rejeitado" | "concluido";

export interface TeamTimeOff {
  id: string;
  teamMemberId: string;
  memberName: string | null;
  type: TeamTimeOffType;
  startDate: string;
  endDate: string;
  status: TeamTimeOffStatus;
  notes: string | null;
  createdAt: string;
}

export type TeamNotificationType = "meta" | "feedback" | "checkin" | "time_off" | "sistema";

export interface TeamNotification {
  id: string;
  teamMemberId: string | null;
  title: string;
  message: string;
  type: TeamNotificationType;
  readAt: string | null;
  createdAt: string;
}

export interface TeamMemberMetrics {
  leadsCount: number;
  clientsCount: number;
  projectsCount: number;
  revenue: number;
  conversionRate: number | null;
}

export interface TeamRankingRow {
  teamMemberId: string;
  name: string;
  photoUrl: string | null;
  revenue: number;
  goalsAchieved: number;
  goalsTotal: number;
  score: number;
}

export interface TeamDashboardIndicators {
  activeMembers: number;
  goalsAchieved: number;
  goalsAtRisk: number;
  averageProductivity: number | null;
  averageResponseMinutes: number | null;
  averageTimeToFirstContactDays: number | null;
}

export interface TeamMemberBreakdownRow {
  teamMemberId: string;
  name: string;
  photoUrl: string | null;
  value: number;
}

export interface TeamDashboardData {
  indicators: TeamDashboardIndicators;
  leadsByMember: TeamMemberBreakdownRow[];
  clientsByMember: TeamMemberBreakdownRow[];
  projectsByMember: TeamMemberBreakdownRow[];
  revenueByMember: TeamMemberBreakdownRow[];
  conversionByMember: TeamMemberBreakdownRow[];
  ranking: TeamRankingRow[];
}

export interface TeamMembersPageData {
  members: TeamMember[];
  roles: TeamRole[];
}

export interface TeamMemberProfileData {
  member: TeamMember;
  metrics: TeamMemberMetrics;
  goals: TeamGoalWithProgress[];
  feedbacks: TeamFeedback[];
  checkins: TeamCheckin[];
  timeOff: TeamTimeOff[];
}

export interface TeamIndividualDashboardData {
  members: { id: string; name: string | null; photoUrl: string | null }[];
  selectedMemberId: string | null;
  profile: TeamMemberProfileData | null;
}

export interface TeamGoalsPageData {
  goals: TeamGoalWithProgress[];
  members: { id: string; name: string | null }[];
}

export interface TeamFeedbackPageData {
  feedbacks: TeamFeedback[];
  members: { id: string; name: string | null }[];
}

export interface TeamCheckinsPageData {
  checkins: TeamCheckin[];
  members: { id: string; name: string | null }[];
}
