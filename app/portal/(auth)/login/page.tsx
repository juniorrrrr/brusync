import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalLoginForm } from "@/components/clientPortal/PortalLoginForm";
import { getCurrentPortalAccess } from "@/services/clientPortal/portalAccessService";

export const metadata: Metadata = {
  title: "Portal do Cliente — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function PortalLoginPage() {
  // Deliberately checks portal access specifically, not just "is there any
  // session" — an internal staff session (or a cliente-role session with no
  // company linked yet) must still see this form, never get bounced here in
  // a loop the way the internal /login's simpler "already authenticated" check
  // would cause if reused as-is.
  const access = await getCurrentPortalAccess();
  if (access) redirect("/portal");

  return (
    <div className="crm-login-page">
      <div className="crm-login-card">
        <div className="crm-login-brand">
          <span className="crm-sidebar-brand-dot" />
          <span className="crm-login-brand-word">
            Brusync <i>OS</i>
          </span>
        </div>

        <h1 className="crm-login-title">Portal do Cliente</h1>
        <p className="crm-login-sub">
          Acompanhe seus projetos, entregas e arquivos em um só lugar.
        </p>

        <PortalLoginForm />
      </div>
    </div>
  );
}
