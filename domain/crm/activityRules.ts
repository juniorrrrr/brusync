import type { ComponentType } from "react";
import {
  IconBolt,
  IconBuilding,
  IconCheck,
  IconCheckCircle,
  IconDoc,
  IconFunnel,
  IconMessage,
  IconPaperclip,
  IconPencil,
  type IconProps,
  IconTarget,
  IconTrash,
  IconUsers,
  IconX,
} from "@/components/ui/icons";
import type { ActivityType } from "@/types/crm";

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  note: "Nota",
  stage_change: "Mudança de estágio",
  call: "Ligação",
  email: "E-mail",
  meeting: "Reunião",
  task: "Tarefa",
  system: "Sistema",
  lead_updated: "Lead editado",
  owner_change: "Responsável alterado",
  note_created: "Nota criada",
  note_updated: "Nota editada",
  note_deleted: "Nota excluída",
  task_created: "Tarefa criada",
  task_updated: "Tarefa editada",
  task_completed: "Tarefa concluída",
  task_deleted: "Tarefa excluída",
  file_upload: "Arquivo enviado",
  file_delete: "Arquivo removido",
  automation: "Automação",
  lead_lost: "Lead perdido",
  lead_reopened: "Lead reaberto",
  client_created: "Cliente criado",
};

export const ACTIVITY_TYPE_ICON: Record<ActivityType, ComponentType<IconProps>> = {
  note: IconMessage,
  stage_change: IconFunnel,
  call: IconMessage,
  email: IconMessage,
  meeting: IconUsers,
  task: IconCheckCircle,
  system: IconTarget,
  lead_updated: IconPencil,
  owner_change: IconUsers,
  note_created: IconMessage,
  note_updated: IconPencil,
  note_deleted: IconTrash,
  task_created: IconCheckCircle,
  task_updated: IconPencil,
  task_completed: IconCheckCircle,
  task_deleted: IconTrash,
  file_upload: IconPaperclip,
  file_delete: IconTrash,
  automation: IconBolt,
  lead_lost: IconX,
  lead_reopened: IconCheck,
  client_created: IconBuilding,
};

/** Fallback icon for a marketing-download timeline entry — not an
 * ActivityType, since downloads come from public.material_leads. */
export const DOWNLOAD_ICON = IconDoc;
