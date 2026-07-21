"use client";

import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";

export function LeadsPagination({
  page,
  limit,
  total,
}: {
  page: number;
  limit: number;
  total: number;
}) {
  const { update } = useUpdateSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="crm-pagination">
      <span>
        Mostrando {from}–{to} de {total}
      </span>
      <div className="crm-pagination-btns">
        <button
          type="button"
          className="crm-page-btn"
          disabled={page <= 1}
          onClick={() => update({ page: String(page - 1) })}
        >
          Anterior
        </button>
        <button
          type="button"
          className="crm-page-btn"
          disabled={page >= totalPages}
          onClick={() => update({ page: String(page + 1) })}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
