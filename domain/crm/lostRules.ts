import type { LostReason } from "@/types/crm";

export const LOST_REASON_LABEL: Record<LostReason, string> = {
  preco: "Preço",
  sem_interesse: "Sem interesse",
  concorrente: "Concorrente",
  sem_orcamento: "Sem orçamento",
  nao_respondeu: "Não respondeu",
  sem_perfil: "Sem perfil",
  outro: "Outro",
};

export const LOST_REASONS: LostReason[] = [
  "preco",
  "sem_interesse",
  "concorrente",
  "sem_orcamento",
  "nao_respondeu",
  "sem_perfil",
  "outro",
];
