"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CRM_NAV } from "@/lib/crm/navigation";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

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
          {CRM_NAV.map((section) => (
            <div key={section.title}>
              <div className="crm-nav-section">{section.title}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = !!item.href && pathname.startsWith(item.href);

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
              })}
            </div>
          ))}
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
