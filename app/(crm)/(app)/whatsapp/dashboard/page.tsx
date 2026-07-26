import type { Metadata } from "next";
import { fetchWhatsappDashboardData } from "@/application/whatsapp/whatsappQueries";
import { WhatsappDashboardSummary } from "@/components/whatsapp/WhatsappDashboardSummary";

export const metadata: Metadata = {
  title: "Dashboard — WhatsApp — Brusync OS",
};

export default async function WhatsappDashboardPage() {
  const data = await fetchWhatsappDashboardData();
  return <WhatsappDashboardSummary data={data} />;
}
