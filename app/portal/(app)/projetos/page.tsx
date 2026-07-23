import type { Metadata } from "next";
import { getPortalProjectsPageData } from "@/application/clientPortal/portalProjectsQueries";
import { PortalProjectCard } from "@/components/clientPortal/PortalProjectCard";

export const metadata: Metadata = {
  title: "Projetos — Portal do Cliente",
  robots: { index: false, follow: false },
};

export default async function PortalProjectsPage() {
  const { projects } = await getPortalProjectsPageData();

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>Seus projetos</h1>
      <p className="crm-card-sub" style={{ marginTop: 4, marginBottom: 20 }}>
        {projects.length} projeto{projects.length === 1 ? "" : "s"}
      </p>

      {projects.length === 0 ? (
        <p className="crm-card-sub">Nenhum projeto em andamento no momento.</p>
      ) : (
        <div className="crm-pt-project-grid">
          {projects.map((project) => (
            <PortalProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
