"use client";

import { useEffect, useState } from "react";
import { fetchLeadAssistantAction } from "@/application/ai/aiLeadAssistantAction";
import { AiInsightsList } from "@/components/ai/AiInsightsList";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { AiSuggestion } from "@/types/ai";

export function AiLeadAssistantTab({ crmLeadId }: { crmLeadId: string }) {
  const [suggestions, setSuggestions] = useState<AiSuggestion[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLeadAssistantAction(crmLeadId).then((data) => {
      if (!cancelled) {
        setSuggestions(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [crmLeadId]);

  if (loading) {
    return (
      <div>
        <Skeleton style={{ height: 90, marginBottom: 12 }} />
        <Skeleton style={{ height: 180 }} />
      </div>
    );
  }

  if (!suggestions) {
    return (
      <Empty>
        <EmptyTitle>Não foi possível carregar o assistente</EmptyTitle>
        <EmptyDescription>Tente novamente em instantes.</EmptyDescription>
      </Empty>
    );
  }

  return <AiInsightsList suggestions={suggestions} />;
}
