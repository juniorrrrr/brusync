import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchTeamMemberProfileData } from "@/application/team/teamQueries";
import { TeamMemberProfileClient } from "@/components/team/TeamMemberProfileClient";

export const metadata: Metadata = {
  title: "Colaborador — Equipe — Brusync OS",
};

export default async function EquipeColaboradorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await fetchTeamMemberProfileData(id);
  if (!profile) notFound();

  return <TeamMemberProfileClient profile={profile} />;
}
