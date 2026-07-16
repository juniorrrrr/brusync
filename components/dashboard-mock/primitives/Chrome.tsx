import type { ReactNode } from "react";

export interface SidebarItem {
  label: string;
  icon: ReactNode;
  active?: boolean;
}

export function Sidebar({ brand, items }: { brand: string; items: SidebarItem[] }) {
  return (
    <div className="dash-side">
      <div className="dash-logo">
        {brand}
        <i>.</i>
      </div>
      {items.map((item) => (
        <div className={item.active ? "dash-item on" : "dash-item"} key={item.label}>
          {item.icon}
          {item.label}
        </div>
      ))}
    </div>
  );
}

export function Topbar({
  title,
  search,
  userInitials,
}: {
  title: string;
  search?: boolean;
  userInitials?: string;
}) {
  return (
    <div className="scr-topbar">
      <h6>{title}</h6>
      <div className="scr-actions">
        {search && (
          <div className="scr-search">
            <svg
              aria-hidden="true"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            Buscar
          </div>
        )}
        {userInitials && <div className="scr-user">{userInitials}</div>}
      </div>
    </div>
  );
}
