"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconChevronDown } from "@/components/ui/icons";
import { CRM_NAV, getActiveGroupId } from "@/lib/crm/navigation";

const OPEN_GROUP_STORAGE_KEY = "brusync:sidebar:open-group";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const activeGroupId = getActiveGroupId(pathname);
  const [openGroupId, setOpenGroupId] = useState<string | null>(activeGroupId);

  // Once mounted, prefer whatever group the user last had open — falls back
  // to the active route's group when nothing was persisted yet. Runs once by
  // design: only the initial (server-matching) activeGroupId should apply here.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only read
  useEffect(() => {
    const stored = window.localStorage.getItem(OPEN_GROUP_STORAGE_KEY);
    const storedIsValidGroup = stored && CRM_NAV.some((group) => group.id === stored);
    setOpenGroupId(storedIsValidGroup ? stored : activeGroupId);
  }, []);

  // Navigating (e.g. via global search or a link outside the sidebar) always
  // reveals the group of the page you landed on.
  useEffect(() => {
    if (activeGroupId) setOpenGroupId(activeGroupId);
  }, [activeGroupId]);

  function toggleGroup(groupId: string) {
    setOpenGroupId((current) => {
      const next = current === groupId ? null : groupId;
      window.localStorage.setItem(OPEN_GROUP_STORAGE_KEY, next ?? "");
      return next;
    });
  }

  function renderItem(item: (typeof CRM_NAV)[number]["items"][number]) {
    const Icon = item.icon;
    const isActive =
      !!item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`));

    if (!item.href) {
      return (
        <div key={item.label} className="crm-nav-item locked">
          <Icon />
          <span className="label">{item.label}</span>
          <span className="crm-nav-soon">Em breve</span>
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={onClose}
        className={`crm-nav-item${isActive ? " active" : ""}`}
      >
        <Icon />
        <span className="label">{item.label}</span>
      </Link>
    );
  }

  return (
    <>
      <aside className={`crm-sidebar${open ? " open" : ""}`}>
        <div className="crm-sidebar-brand">
          <span className="crm-sidebar-brand-dot" />
          <div>
            <div className="crm-sidebar-brand-word">
              Brusync <i>OS</i>
            </div>
          </div>
        </div>

        <nav className="crm-nav">
          {CRM_NAV.map((group) => {
            if (group.standalone) {
              return <div key={group.id}>{group.items.map(renderItem)}</div>;
            }

            const GroupIcon = group.icon;
            const isOpen = openGroupId === group.id;
            const isGroupActive = group.id === activeGroupId;

            return (
              <div key={group.id} className="crm-nav-group">
                <button
                  type="button"
                  className={`crm-nav-group-head${isGroupActive ? " active" : ""}`}
                  aria-expanded={isOpen}
                  onClick={() => toggleGroup(group.id)}
                >
                  {GroupIcon && <GroupIcon size={16} />}
                  <span className="label">{group.title}</span>
                  <span className={`crm-nav-chevron${isOpen ? " open" : ""}`}>
                    <IconChevronDown size={15} />
                  </span>
                </button>
                <div className={`crm-nav-group-body${isOpen ? " open" : ""}`}>
                  <div className="crm-nav-group-body-inner">{group.items.map(renderItem)}</div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
      <button
        type="button"
        aria-label="Fechar menu"
        className={`crm-sidebar-scrim${open ? " open" : ""}`}
        onClick={onClose}
      />
    </>
  );
}
