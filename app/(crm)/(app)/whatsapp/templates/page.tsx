import type { Metadata } from "next";
import { fetchWhatsappTemplates } from "@/application/whatsapp/whatsappQueries";
import { WhatsappTemplatesList } from "@/components/whatsapp/WhatsappTemplatesList";

export const metadata: Metadata = {
  title: "Templates — WhatsApp — Brusync OS",
};

export default async function WhatsappTemplatesPage() {
  const templates = await fetchWhatsappTemplates();
  return <WhatsappTemplatesList templates={templates} />;
}
