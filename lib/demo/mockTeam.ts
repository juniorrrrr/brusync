import { resolveGoalPeriodDefault } from "@/domain/performance/periods";
import { TEAM_GOAL_TYPES } from "@/domain/team/goalTypes";
import { DEMO_OWNERS } from "@/lib/demo/mockSeed";
import type {
  TeamCheckin,
  TeamCheckinStatus,
  TeamCheckinType,
  TeamFeedback,
  TeamFeedbackStatus,
  TeamFeedbackType,
  TeamGoal,
  TeamGoalPeriodType,
  TeamGoalStatus,
  TeamGoalType,
  TeamMember,
  TeamMemberStatus,
  TeamNotification,
  TeamRole,
  TeamTimeOff,
  TeamTimeOffStatus,
  TeamTimeOffType,
} from "@/types/team";

/** Fictitious dataset for "Modo Demonstração" — nunca gravado no Supabase.
 * Os 4 primeiros colaboradores reaproveitam os mesmos DEMO_OWNERS já usados
 * em leads/clientes/projetos/agenda (mockSeed.ts), para que "Leads/Clientes/
 * Projetos/Receita por responsável" bata com os números que já aparecem nos
 * outros módulos em Modo Demonstração — mesmo princípio de
 * mockPerformance.ts::getDemoStaffWithRole. Os outros 6 são papéis
 * administrativos/suporte fictícios sem vínculo de CRM (o que é realista:
 * nem todo colaborador é dono de lead/cliente/projeto). */

let seq = 0;
function demoId(prefix: string): string {
  seq += 1;
  return `00000000-team-4000-8000-${prefix}${String(seq).padStart(9, "0")}`;
}

const now = new Date();

interface MemberSeed {
  profileId: string;
  name: string;
  email: string;
  accessRole: TeamMember["accessRole"];
  roleName: string;
  department: string;
  entryDaysAgo: number;
  status: TeamMemberStatus;
  phone: string;
  supervisorIndex: number | null;
}

const MEMBER_SEEDS: MemberSeed[] = [
  {
    profileId: "00000000-0000-4000-8000-000000000110",
    name: "Marcos Vieira",
    email: "marcos.vieira@brusync.com.br",
    accessRole: "gestor",
    roleName: "Diretor Comercial",
    department: "Diretoria",
    entryDaysAgo: 900,
    status: "ativo",
    phone: "47999033001",
    supervisorIndex: null,
  },
  {
    profileId: DEMO_OWNERS[0].id,
    name: DEMO_OWNERS[0].name ?? "Camila Rocha",
    email: DEMO_OWNERS[0].email ?? "camila.rocha@brusync.com.br",
    accessRole: "gestor",
    roleName: "Gestora Comercial",
    department: "Comercial",
    entryDaysAgo: 620,
    status: "ativo",
    phone: "47999033002",
    supervisorIndex: 0,
  },
  {
    profileId: DEMO_OWNERS[1].id,
    name: DEMO_OWNERS[1].name ?? "Rafael Souza",
    email: DEMO_OWNERS[1].email ?? "rafael.souza@brusync.com.br",
    accessRole: "comercial",
    roleName: "Executivo de Vendas Sênior",
    department: "Comercial",
    entryDaysAgo: 480,
    status: "ativo",
    phone: "47999033003",
    supervisorIndex: 1,
  },
  {
    profileId: DEMO_OWNERS[2].id,
    name: DEMO_OWNERS[2].name ?? "Juliana Alves",
    email: DEMO_OWNERS[2].email ?? "juliana.alves@brusync.com.br",
    accessRole: "comercial",
    roleName: "Executiva de Vendas",
    department: "Comercial",
    entryDaysAgo: 340,
    status: "ferias",
    phone: "47999033004",
    supervisorIndex: 1,
  },
  {
    profileId: DEMO_OWNERS[3].id,
    name: DEMO_OWNERS[3].name ?? "Thiago Martins",
    email: DEMO_OWNERS[3].email ?? "thiago.martins@brusync.com.br",
    accessRole: "atendimento",
    roleName: "Analista de Atendimento Sênior",
    department: "Atendimento",
    entryDaysAgo: 400,
    status: "ativo",
    phone: "47999033005",
    supervisorIndex: 1,
  },
  {
    profileId: "00000000-0000-4000-8000-000000000111",
    name: "Patrícia Nogueira",
    email: "patricia.nogueira@brusync.com.br",
    accessRole: "gestor",
    roleName: "Analista Financeiro",
    department: "Financeiro",
    entryDaysAgo: 560,
    status: "ativo",
    phone: "47999033006",
    supervisorIndex: 0,
  },
  {
    profileId: "00000000-0000-4000-8000-000000000112",
    name: "Bruno Carvalho",
    email: "bruno.carvalho@brusync.com.br",
    accessRole: "comercial",
    roleName: "Analista de Marketing",
    department: "Marketing",
    entryDaysAgo: 310,
    status: "ativo",
    phone: "47999033007",
    supervisorIndex: 0,
  },
  {
    profileId: "00000000-0000-4000-8000-000000000113",
    name: "Fernanda Diniz",
    email: "fernanda.diniz@brusync.com.br",
    accessRole: "atendimento",
    roleName: "Suporte N1",
    department: "Atendimento",
    entryDaysAgo: 200,
    status: "ativo",
    phone: "47999033008",
    supervisorIndex: 4,
  },
  {
    profileId: "00000000-0000-4000-8000-000000000114",
    name: "Rodrigo Nascimento",
    email: "rodrigo.nascimento@brusync.com.br",
    accessRole: "atendimento",
    roleName: "Suporte N2",
    department: "Atendimento",
    entryDaysAgo: 150,
    status: "afastado",
    phone: "47999033009",
    supervisorIndex: 4,
  },
  {
    profileId: "00000000-0000-4000-8000-000000000115",
    name: "Larissa Prado",
    email: "larissa.prado@brusync.com.br",
    accessRole: "administrador",
    roleName: "Administradora de Sistema",
    department: "TI",
    entryDaysAgo: 700,
    status: "ativo",
    phone: "47999033010",
    supervisorIndex: null,
  },
];

function daysAgo(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export const DEMO_TEAM_ROLES: TeamRole[] = [...new Set(MEMBER_SEEDS.map((m) => m.roleName))].map(
  (name) => ({
    id: demoId("role"),
    name,
    department: MEMBER_SEEDS.find((m) => m.roleName === name)?.department ?? null,
    description: null,
    createdAt: daysAgo(900),
  }),
);

const roleIdByName = new Map(DEMO_TEAM_ROLES.map((r) => [r.name, r.id]));

const memberIds = MEMBER_SEEDS.map(() => demoId("mem"));

export const DEMO_TEAM_MEMBERS: TeamMember[] = MEMBER_SEEDS.map((seed, index) => ({
  id: memberIds[index],
  profileId: seed.profileId,
  name: seed.name,
  email: seed.email,
  accessRole: seed.accessRole,
  photoUrl: null,
  roleId: roleIdByName.get(seed.roleName) ?? null,
  roleName: seed.roleName,
  department: seed.department,
  entryDate: daysAgo(seed.entryDaysAgo).slice(0, 10),
  status: seed.status,
  phone: seed.phone,
  supervisorId: seed.supervisorIndex !== null ? memberIds[seed.supervisorIndex] : null,
  supervisorName: seed.supervisorIndex !== null ? MEMBER_SEEDS[seed.supervisorIndex].name : null,
  notes: null,
  createdAt: daysAgo(seed.entryDaysAgo),
  updatedAt: daysAgo(1),
}));

export function getDemoTeamMembers(): TeamMember[] {
  return DEMO_TEAM_MEMBERS;
}

export function getDemoTeamRoles(): TeamRole[] {
  return DEMO_TEAM_ROLES;
}

export function getDemoTeamMemberById(id: string): TeamMember | null {
  return DEMO_TEAM_MEMBERS.find((m) => m.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Metas — ~120 no total: 12 por colaborador (7 tipos ativos no mês corrente,
// 3 variações trimestrais, 2 arquivadas do mês anterior).
// ---------------------------------------------------------------------------

const TARGET_BY_TYPE: Record<TeamGoalType, () => number> = {
  receita: () => 18000 + Math.round(Math.random() * 42000),
  leads: () => 6 + Math.round(Math.random() * 24),
  conversao: () => 15 + Math.round(Math.random() * 20),
  projetos: () => 1 + Math.round(Math.random() * 4),
  clientes: () => 2 + Math.round(Math.random() * 8),
  atividades: () => 10 + Math.round(Math.random() * 30),
  tempo_resposta: () => 10 + Math.round(Math.random() * 50),
};

const DIRECTION_BY_TYPE: Record<TeamGoalType, "maior_melhor" | "menor_melhor"> = {
  receita: "maior_melhor",
  leads: "maior_melhor",
  conversao: "maior_melhor",
  projetos: "maior_melhor",
  clientes: "maior_melhor",
  atividades: "maior_melhor",
  tempo_resposta: "menor_melhor",
};

function buildGoal(
  teamMemberId: string,
  type: TeamGoalType,
  periodType: TeamGoalPeriodType,
  referenceDate: Date,
  status: TeamGoalStatus,
): TeamGoal {
  const { periodStart, periodEnd } = resolveGoalPeriodDefault(periodType, referenceDate);
  return {
    id: demoId("goal"),
    teamMemberId,
    type,
    periodType,
    periodStart,
    periodEnd,
    targetValue: TARGET_BY_TYPE[type](),
    direction: DIRECTION_BY_TYPE[type],
    status,
    notes: null,
    createdBy: MEMBER_SEEDS[0].profileId,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
  };
}

const lastMonthReference = new Date(now.getFullYear(), now.getMonth() - 1, 15);
const quarterTypes: TeamGoalType[] = ["receita", "leads", "conversao"];

const DEMO_TEAM_GOALS: TeamGoal[] = DEMO_TEAM_MEMBERS.flatMap((member) => {
  const goals: TeamGoal[] = [];

  for (const type of TEAM_GOAL_TYPES) {
    goals.push(buildGoal(member.id, type, "mensal", now, "ativa"));
  }
  for (const type of quarterTypes) {
    goals.push(buildGoal(member.id, type, "trimestral", now, "ativa"));
  }
  goals.push(buildGoal(member.id, "receita", "mensal", lastMonthReference, "arquivada"));
  goals.push(buildGoal(member.id, "leads", "mensal", lastMonthReference, "arquivada"));

  return goals;
});

export function getDemoTeamGoals(status?: TeamGoalStatus, teamMemberId?: string): TeamGoal[] {
  return DEMO_TEAM_GOALS.filter(
    (g) => (!status || g.status === status) && (!teamMemberId || g.teamMemberId === teamMemberId),
  );
}

// ---------------------------------------------------------------------------
// Feedbacks — ~80 no total (8 por colaborador).
// ---------------------------------------------------------------------------

const FEEDBACK_TEMPLATES: { type: TeamFeedbackType; comment: string }[] = [
  { type: "elogio", comment: "Excelente condução da negociação com o cliente esta semana." },
  { type: "elogio", comment: "Ótimo trabalho em equipe no fechamento do último projeto." },
  {
    type: "construtivo",
    comment: "Precisa melhorar o tempo de resposta às mensagens dos leads mais quentes.",
  },
  {
    type: "construtivo",
    comment: "Sugestão: detalhar mais as propostas antes de enviar ao cliente.",
  },
  { type: "reconhecimento", comment: "Bateu a meta do trimestre com folga — parabéns!" },
  {
    type: "reconhecimento",
    comment: "Reconhecimento pelo excelente índice de satisfação do cliente.",
  },
  { type: "alerta", comment: "Atenção ao volume de tarefas em atraso na última semana." },
  { type: "alerta", comment: "Notamos queda na taxa de conversão — vale uma conversa 1:1." },
];

const DEMO_TEAM_FEEDBACKS: TeamFeedback[] = DEMO_TEAM_MEMBERS.flatMap((member, memberIndex) =>
  Array.from({ length: 8 }, (_, i) => {
    const template = FEEDBACK_TEMPLATES[(memberIndex + i) % FEEDBACK_TEMPLATES.length];
    const author = DEMO_TEAM_MEMBERS[(memberIndex + 1) % DEMO_TEAM_MEMBERS.length];
    const status: TeamFeedbackStatus =
      i % 4 === 0 ? "arquivado" : i % 3 === 0 ? "reconhecido" : "aberto";
    return {
      id: demoId("fb"),
      authorId: author.profileId,
      authorName: author.name,
      recipientTeamMemberId: member.id,
      recipientName: member.name,
      type: template.type,
      comment: template.comment,
      status,
      createdAt: daysAgo(5 + i * 9),
      updatedAt: daysAgo(2 + i * 3),
    } satisfies TeamFeedback;
  }),
);

export function getDemoTeamFeedbacks(teamMemberId?: string): TeamFeedback[] {
  const rows = teamMemberId
    ? DEMO_TEAM_FEEDBACKS.filter((f) => f.recipientTeamMemberId === teamMemberId)
    : DEMO_TEAM_FEEDBACKS;
  return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// ---------------------------------------------------------------------------
// Check-ins — ~60 no total (6 por colaborador).
// ---------------------------------------------------------------------------

const CHECKIN_TYPES: TeamCheckinType[] = ["1_1", "reuniao", "avaliacao", "alinhamento"];
const CHECKIN_NOTES = [
  "Alinhamento de prioridades da semana e revisão de pipeline.",
  "Avaliação de desempenho do período — pontos fortes e oportunidades.",
  "1:1 de acompanhamento de metas individuais.",
  "Reunião de alinhamento com o time sobre novos processos.",
];

const DEMO_TEAM_CHECKINS: TeamCheckin[] = DEMO_TEAM_MEMBERS.flatMap((member, memberIndex) =>
  Array.from({ length: 6 }, (_, i) => {
    const type = CHECKIN_TYPES[(memberIndex + i) % CHECKIN_TYPES.length];
    const author = member.supervisorId
      ? (DEMO_TEAM_MEMBERS.find((m) => m.id === member.supervisorId) ?? DEMO_TEAM_MEMBERS[0])
      : DEMO_TEAM_MEMBERS[0];
    const daysFromNow = (i - 3) * 12;
    const status: TeamCheckinStatus =
      daysFromNow < -2 ? "realizado" : daysFromNow > 2 ? "agendado" : "realizado";
    return {
      id: demoId("chk"),
      teamMemberId: member.id,
      memberName: member.name,
      authorId: author.profileId,
      authorName: author.name,
      type,
      scheduledAt: new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000).toISOString(),
      notes: CHECKIN_NOTES[(memberIndex + i) % CHECKIN_NOTES.length],
      status,
      createdAt: daysAgo(30 - i * 4),
      updatedAt: daysAgo(1),
    } satisfies TeamCheckin;
  }),
);

export function getDemoTeamCheckins(teamMemberId?: string): TeamCheckin[] {
  const rows = teamMemberId
    ? DEMO_TEAM_CHECKINS.filter((c) => c.teamMemberId === teamMemberId)
    : DEMO_TEAM_CHECKINS;
  return [...rows].sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1));
}

// ---------------------------------------------------------------------------
// Ausências — ~15 no total.
// ---------------------------------------------------------------------------

const TIME_OFF_TYPES: TeamTimeOffType[] = ["ferias", "licenca", "folga", "atestado"];

const DEMO_TEAM_TIME_OFF: TeamTimeOff[] = DEMO_TEAM_MEMBERS.flatMap((member, index) => {
  const count = index % 3 === 0 ? 2 : 1;
  return Array.from({ length: count }, (_, i) => {
    const type = TIME_OFF_TYPES[(index + i) % TIME_OFF_TYPES.length];
    const status: TeamTimeOffStatus =
      member.status === "ferias" && i === 0
        ? "aprovado"
        : (["solicitado", "aprovado", "concluido"] as const)[(index + i) % 3];
    const startOffset = 10 + index * 6 + i * 20;
    const duration = type === "ferias" ? 15 : type === "licenca" ? 10 : type === "atestado" ? 2 : 1;
    return {
      id: demoId("off"),
      teamMemberId: member.id,
      memberName: member.name,
      type,
      startDate: new Date(now.getTime() - startOffset * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      endDate: new Date(now.getTime() - (startOffset - duration) * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      status,
      notes: null,
      createdAt: daysAgo(startOffset + 3),
    } satisfies TeamTimeOff;
  });
});

export function getDemoTeamTimeOff(teamMemberId?: string): TeamTimeOff[] {
  const rows = teamMemberId
    ? DEMO_TEAM_TIME_OFF.filter((t) => t.teamMemberId === teamMemberId)
    : DEMO_TEAM_TIME_OFF;
  return [...rows].sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}

// ---------------------------------------------------------------------------
// Notificações — ~20 no total.
// ---------------------------------------------------------------------------

const DEMO_TEAM_NOTIFICATIONS: TeamNotification[] = DEMO_TEAM_MEMBERS.flatMap((member, index) => {
  if (index % 2 !== 0) return [];
  return [
    {
      id: demoId("ntf"),
      teamMemberId: member.id,
      title: "Meta batida",
      message: `${member.name} atingiu a meta de leads do mês.`,
      type: "meta" as const,
      readAt: index % 4 === 0 ? daysAgo(1) : null,
      createdAt: daysAgo(3 + index),
    },
    {
      id: demoId("ntf"),
      teamMemberId: member.id,
      title: "Novo feedback recebido",
      message: `${member.name} recebeu um novo feedback da liderança.`,
      type: "feedback" as const,
      readAt: null,
      createdAt: daysAgo(6 + index),
    },
  ];
});

export function getDemoTeamNotifications(teamMemberId?: string): TeamNotification[] {
  const rows = teamMemberId
    ? DEMO_TEAM_NOTIFICATIONS.filter(
        (n) => n.teamMemberId === teamMemberId || n.teamMemberId === null,
      )
    : DEMO_TEAM_NOTIFICATIONS;
  return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
