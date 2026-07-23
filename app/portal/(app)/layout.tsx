import type { ReactNode } from "react";
import { PortalShell } from "@/components/clientPortal/PortalShell";
import { requirePortalAccess } from "@/services/clientPortal/portalAccessService";
import "@/styles/crm.css";
import "@/styles/clientPortal.css";

export default async function PortalAppLayout({ children }: { children: ReactNode }) {
  const access = await requirePortalAccess();

  return <PortalShell access={access}>{children}</PortalShell>;
}
