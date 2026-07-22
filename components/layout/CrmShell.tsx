"use client";

import { type ReactNode, useState } from "react";
import { GlobalSearch } from "@/components/crm/GlobalSearch";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import type { Profile } from "@/services/auth/session";

export function CrmShell({ profile, children }: { profile: Profile | null; children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="crm-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="crm-main">
        <Header
          profile={profile}
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => setSearchOpen(true)}
        />
        <div className="crm-content">{children}</div>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
