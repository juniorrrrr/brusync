"use client";

import { IconBell, IconLogout, IconMenu, IconSearch } from "@/components/ui/icons";
import { signOut } from "@/services/auth/logout";
import type { Profile } from "@/services/auth/session";

const ROLE_LABEL: Record<Profile["role"], string> = {
  administrador: "Administrador",
  gestor: "Gestor",
  comercial: "Comercial",
  atendimento: "Atendimento",
  cliente: "Cliente",
};

function initials(name: string | null, email: string | null) {
  const source = name?.trim() || email?.trim() || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function Header({
  profile,
  onMenuClick,
  onSearchClick,
}: {
  profile: Profile | null;
  onMenuClick: () => void;
  onSearchClick: () => void;
}) {
  const displayName = profile?.name || profile?.email || "Usuário";
  const roleLabel = profile ? ROLE_LABEL[profile.role] : "";

  return (
    <header className="crm-header">
      <div className="crm-header-left">
        <button
          type="button"
          className="crm-menu-btn"
          aria-label="Abrir menu"
          onClick={onMenuClick}
        >
          <IconMenu />
        </button>
        <div>
          <div className="crm-header-title">Brusync OS</div>
        </div>
      </div>

      <div className="crm-header-right">
        <button
          type="button"
          className="crm-cmdk-trigger"
          onClick={onSearchClick}
          aria-label="Busca global"
        >
          <IconSearch size={14} />
          Buscar leads...
          <kbd>⌘K</kbd>
        </button>

        <button type="button" className="crm-icon-btn" aria-label="Notificações">
          <IconBell />
        </button>

        <div className="crm-header-user">
          <div className="crm-avatar" aria-hidden="true">
            {initials(profile?.name ?? null, profile?.email ?? null)}
          </div>
          <div className="crm-header-user-info">
            <div className="crm-header-user-name">{displayName}</div>
            <div className="crm-header-user-role">{roleLabel}</div>
          </div>
        </div>

        <form action={signOut}>
          <button type="submit" className="crm-icon-btn" aria-label="Sair">
            <IconLogout />
          </button>
        </form>
      </div>
    </header>
  );
}
