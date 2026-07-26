import type { Metadata } from "next";
import { fetchWhatsappAccount } from "@/application/whatsapp/whatsappQueries";
import { WhatsappAccountSettingsForm } from "@/components/whatsapp/WhatsappAccountSettingsForm";

export const metadata: Metadata = {
  title: "Configurações — WhatsApp — Brusync OS",
};

export default async function WhatsappConfiguracoesPage() {
  const account = await fetchWhatsappAccount();
  return <WhatsappAccountSettingsForm account={account} />;
}
