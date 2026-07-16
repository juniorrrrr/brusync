import type { ComponentType } from "react";
import type { IconProps } from "@/components/ui/icons";

export interface NavItem {
  label: string;
  href?: string;
  icon: ComponentType<IconProps>;
  soon?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export type LeadStatus = "novo" | "contato" | "qualificado" | "proposta" | "fechado";

export interface Lead {
  id: string;
  name: string;
  company: string;
  origin: string;
  status: LeadStatus;
  owner: string;
  createdAt: string;
}

export interface PipelineColumn {
  status: LeadStatus;
  title: string;
  leads: Lead[];
}
