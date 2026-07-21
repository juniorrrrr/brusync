"use client";

import { useEffect, useState } from "react";
import { IconSearch } from "@/components/ui/icons";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";

export function ClientsToolbar({ initialSearch }: { initialSearch: string }) {
  const { update } = useUpdateSearchParams();
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    const timeout = setTimeout(() => update({ q: search || null }), 350);
    return () => clearTimeout(timeout);
  }, [search, update]);

  return (
    <div className="crm-toolbar">
      <div className="crm-search">
        <IconSearch />
        <input
          type="text"
          placeholder="Buscar por empresa, contato ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  );
}
