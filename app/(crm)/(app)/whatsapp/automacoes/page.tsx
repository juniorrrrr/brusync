import type { Metadata } from "next";
import { fetchWhatsappAutomations } from "@/application/whatsapp/whatsappQueries";
import { WhatsappAutomationsList } from "@/components/whatsapp/WhatsappAutomationsList";

export const metadata: Metadata = {
  title: "Automações — WhatsApp — Brusync OS",
};

export default async function WhatsappAutomacoesPage() {
  const data = await fetchWhatsappAutomations();
  return <WhatsappAutomationsList automations={data.automations} templates={data.templates} />;
}
