"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTimelinePage } from "@/application/crm/timelineActions";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ACTIVITY_TYPE_ICON, ACTIVITY_TYPE_LABEL, DOWNLOAD_ICON } from "@/domain/crm/activityRules";
import { formatDateTime, formatRelativeToNow } from "@/domain/crm/format";
import type { TimelineEntry } from "@/types/crm";

function entryCreatedAt(entry: TimelineEntry): string {
  return entry.source === "activity" ? entry.activity.createdAt : entry.download.createdAt;
}

function EntryRow({ entry }: { entry: TimelineEntry }) {
  if (entry.source === "download") {
    const Icon = DOWNLOAD_ICON;
    return (
      <div className="crm-tl-item">
        <span className="crm-tl-ico">
          <Icon size={15} />
        </span>
        <div>
          <div className="crm-tl-title">Baixou {entry.download.materialTitle}</div>
          <div className="crm-tl-meta">
            Download de material · {formatRelativeToNow(entry.download.createdAt)}
          </div>
        </div>
      </div>
    );
  }

  const { activity } = entry;
  const Icon = ACTIVITY_TYPE_ICON[activity.type];
  return (
    <div className="crm-tl-item">
      <span className="crm-tl-ico">
        <Icon size={15} />
      </span>
      <div>
        <div className="crm-tl-title">{activity.title}</div>
        <div className="crm-tl-meta">
          {ACTIVITY_TYPE_LABEL[activity.type]} · {activity.createdByName ?? "Sistema"} ·{" "}
          {formatRelativeToNow(activity.createdAt)}
        </div>
        {activity.body && <div className="crm-tl-body">{activity.body}</div>}
      </div>
    </div>
  );
}

export function TimelineTab({
  crmLeadId,
  refreshToken,
}: {
  crmLeadId: string;
  refreshToken: string;
}) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // refreshToken is the lead's updated_at — bumped by every mutation that can
  // register a new timeline event (stage move, mark lost/reopen, edit). Since
  // this tab only mounts once per Drawer open (see WorkspaceTabs' `visited`
  // set), it otherwise has no way to notice activities created while it's
  // already showing.
  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshToken is an intentional cache-busting dependency, not read inside the effect body — it exists solely to force a refetch when the lead is mutated elsewhere.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTimelinePage(crmLeadId).then((page) => {
      if (cancelled) return;
      setEntries(page.entries);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [crmLeadId, refreshToken]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    const page = await fetchTimelinePage(crmLeadId, cursor);
    setEntries((prev) => [...prev, ...page.entries]);
    setCursor(page.nextCursor);
    setHasMore(page.nextCursor !== null);
    setLoadingMore(false);
  }, [crmLeadId, cursor, loadingMore]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entriesObserved) => {
        if (entriesObserved[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  if (loading) {
    return (
      <div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="crm-ws-skeleton-row">
            <Skeleton style={{ width: 30, height: 30, borderRadius: 9 }} />
            <div style={{ flex: 1 }}>
              <Skeleton style={{ width: "60%", height: 13, marginBottom: 6 }} />
              <Skeleton style={{ width: "40%", height: 11 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Empty>
        <EmptyMedia variant="icon">📋</EmptyMedia>
        <EmptyTitle>Nenhuma atividade ainda</EmptyTitle>
        <EmptyDescription>
          Tudo que acontecer com este lead — mudanças de estágio, notas, tarefas, arquivos — aparece
          aqui automaticamente.
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div>
      {entries.map((entry) => (
        <EntryRow
          key={entry.source === "activity" ? entry.activity.id : `dl-${entry.download.id}`}
          entry={entry}
        />
      ))}
      {hasMore && (
        <div ref={sentinelRef} style={{ textAlign: "center", padding: "8px 0" }}>
          <span className="crm-card-sub">{loadingMore ? "Carregando…" : ""}</span>
        </div>
      )}
      {!hasMore && entries.length > 0 && (
        <p className="crm-card-sub" style={{ textAlign: "center" }}>
          Início da timeline · {formatDateTime(entryCreatedAt(entries[entries.length - 1]))}
        </p>
      )}
    </div>
  );
}
