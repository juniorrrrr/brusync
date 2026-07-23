"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWorkflows } from "@/application/automation/workflowsActions";
import type { AutomationWorkflow } from "@/types/automation";

/** Client-side data source for the Lista screen — reloaded after the editor
 * saves/deletes a workflow (contexts/automation/AutomationEditorContext
 * closes on success) or a status toggle flips, without a full page reload. */
export function useWorkflowsList() {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    fetchWorkflows()
      .then(setWorkflows)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { workflows, loading, reload };
}
