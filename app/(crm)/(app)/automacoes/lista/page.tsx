import type { Metadata } from "next";
import { getPipelineStageOptions } from "@/application/automation/workflowsActions";
import { WorkflowsList } from "@/components/automation/WorkflowsList";

export const metadata: Metadata = {
  title: "Lista de Automações — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function AutomacoesListaPage() {
  const pipelineStages = await getPipelineStageOptions();

  return <WorkflowsList pipelineStages={pipelineStages} />;
}
