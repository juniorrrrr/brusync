import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPortalProjectFinancialSummary } from "@/application/clientPortal/portalFinancialQueries";
import { getPortalProjectDetailPageData } from "@/application/clientPortal/portalProjectsQueries";
import { PortalProjectFinancialCard } from "@/components/clientPortal/PortalProjectFinancialCard";
import { PortalProjectTabs } from "@/components/clientPortal/PortalProjectTabs";
import { PortalSummaryCard } from "@/components/clientPortal/PortalSummaryCard";
import { IconArrowLeft } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Projeto — Portal do Cliente",
  robots: { index: false, follow: false },
};

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { access, project } = await getPortalProjectDetailPageData(id);

  if (!project) notFound();

  const financialSummary = await fetchPortalProjectFinancialSummary(id);

  return (
    <div>
      <Link
        href="/portal/projetos"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}
        className="crm-card-sub"
      >
        <IconArrowLeft size={14} />
        Voltar aos projetos
      </Link>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>{project.name}</h1>
      <p className="crm-card-sub" style={{ marginTop: 4, marginBottom: 20 }}>
        {access.clientCompany}
      </p>

      <PortalSummaryCard project={project} />
      <PortalProjectFinancialCard summary={financialSummary} />

      <div style={{ marginTop: 20 }}>
        <PortalProjectTabs project={project} canUploadFiles={access.canUploadFiles} />
      </div>
    </div>
  );
}
