import type { Lead, LeadStatus, PipelineColumn } from "@/types/crm";

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo",
  contato: "Em contato",
  qualificado: "Qualificado",
  proposta: "Proposta",
  fechado: "Fechado",
};

export const LEAD_STATUS_BADGE: Record<LeadStatus, "info" | "warn" | "ok" | "neutral"> = {
  novo: "info",
  contato: "warn",
  qualificado: "warn",
  proposta: "info",
  fechado: "ok",
};

export const MOCK_LEADS: Lead[] = [
  {
    id: "1",
    name: "Marina Cavalcanti",
    company: "Grupo Alvorada",
    origin: "Google Ads",
    status: "proposta",
    owner: "Rafael Souza",
    createdAt: "2026-07-10",
  },
  {
    id: "2",
    name: "Eduardo Lins",
    company: "Lins Distribuidora",
    origin: "Indicação",
    status: "qualificado",
    owner: "Camila Rocha",
    createdAt: "2026-07-09",
  },
  {
    id: "3",
    name: "Beatriz Amaral",
    company: "Amaral Contábil",
    origin: "Instagram",
    status: "contato",
    owner: "Rafael Souza",
    createdAt: "2026-07-08",
  },
  {
    id: "4",
    name: "João Pedro Melo",
    company: "Melo Engenharia",
    origin: "Orgânico",
    status: "novo",
    owner: "Camila Rocha",
    createdAt: "2026-07-07",
  },
  {
    id: "5",
    name: "Fernanda Duarte",
    company: "Duarte & Cia",
    origin: "Google Ads",
    status: "fechado",
    owner: "Rafael Souza",
    createdAt: "2026-07-02",
  },
];

export function getMockLeadById(id: string): Lead | undefined {
  return MOCK_LEADS.find((lead) => lead.id === id);
}

export function getPipelineColumns(): PipelineColumn[] {
  const order: LeadStatus[] = ["novo", "contato", "qualificado", "proposta", "fechado"];
  return order.map((status) => ({
    status,
    title: LEAD_STATUS_LABEL[status],
    leads: MOCK_LEADS.filter((lead) => lead.status === status),
  }));
}
