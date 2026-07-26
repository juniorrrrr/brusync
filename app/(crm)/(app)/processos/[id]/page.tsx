import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProcessDetail } from "@/application/processes/processesQueries";
import { ProcessDetailClient } from "@/components/processes/ProcessDetailClient";

export const metadata: Metadata = {
  title: "Processo — Brusync OS",
};

export default async function ProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const process = await fetchProcessDetail(id);
  if (!process) notFound();

  return <ProcessDetailClient process={process} />;
}
