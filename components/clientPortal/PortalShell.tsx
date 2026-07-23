import Link from "next/link";
import { portalSignOutAction } from "@/application/clientPortal/portalAuthActions";
import { IconLogout } from "@/components/ui/icons";
import { isDemoModeActive } from "@/services/demo/demoMode";
import type { PortalAccess } from "@/types/clientPortal";

/** The portal's own shell — deliberately not the internal CrmShell
 * (sidebar, GlobalSearch, Header with staff nav): a client contact should
 * see a simple top bar, never anything hinting at the CRM behind it. */
export async function PortalShell({
  access,
  children,
}: {
  access: PortalAccess;
  children: React.ReactNode;
}) {
  const demoActive = await isDemoModeActive();

  return (
    <div className="crm-pt-shell">
      <header className="crm-pt-header">
        <Link href="/portal" className="crm-pt-brand">
          <span className="crm-sidebar-brand-dot" />
          <span className="crm-pt-brand-word">
            Brusync <i>OS</i>
          </span>
        </Link>

        <div className="crm-pt-header-right">
          {demoActive && <span className="crm-pt-demo-badge">Modo Demonstração</span>}
          <span className="crm-pt-company">{access.clientCompany}</span>
          <form action={portalSignOutAction}>
            <button type="submit" className="crm-pt-logout" aria-label="Sair">
              <IconLogout size={16} />
              Sair
            </button>
          </form>
        </div>
      </header>

      <nav className="crm-pt-nav">
        <Link href="/portal" className="crm-pt-nav-link">
          Início
        </Link>
        <Link href="/portal/projetos" className="crm-pt-nav-link">
          Projetos
        </Link>
      </nav>

      <main className="crm-pt-content">{children}</main>
    </div>
  );
}
