"use client";

import { formatDateTime } from "@/domain/crm/format";
import { SYNC_JOB_STATUS_BADGE, SYNC_JOB_STATUS_LABEL } from "@/domain/metaAds/statusMeta";
import { useMetaAdsSync } from "@/hooks/metaAds/useMetaAdsSync";
import type { MetaSyncJob } from "@/types/metaAds";

export function MetaAdsSyncStatusPanel({
  accountId,
  jobs,
}: {
  accountId: string;
  jobs: MetaSyncJob[];
}) {
  const { sync, isPending, message } = useMetaAdsSync(accountId);

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Sincronização</div>
          <div className="crm-card-sub">Fila com retry automático e backoff exponencial</div>
        </div>
        <button type="button" className="btn btn-accent" disabled={isPending} onClick={sync}>
          {isPending ? "Sincronizando…" : "Sincronizar agora"}
        </button>
      </div>

      {message && (
        <p style={{ color: message.ok ? "#1fa971" : "var(--danger)", fontSize: 13, marginTop: 8 }}>
          {message.text}
        </p>
      )}

      {jobs.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nenhuma sincronização registrada ainda.
        </p>
      ) : (
        <div className="crm-mini-list" style={{ marginTop: 12 }}>
          {jobs.map((job) => (
            <div key={job.id} className="crm-mini-row">
              <span className="crm-mini-ico">•</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="crm-mini-title">{job.jobType}</div>
                <div className="crm-mini-meta">
                  {job.finishedAt ? formatDateTime(job.finishedAt) : "Em andamento"}
                  {job.error ? ` — ${job.error}` : ""}
                </div>
              </div>
              <span className={`crm-badge ${SYNC_JOB_STATUS_BADGE[job.status]}`}>
                {SYNC_JOB_STATUS_LABEL[job.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
