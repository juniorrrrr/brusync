import type { IntegrationCategory } from "@/types/integrations";

/** Static reference catalog — the fixed identity of each provider Brusync OS
 * knows how to eventually connect (name, category, description, logo). Never
 * holds connection state (status, enabled, health) — that lives exclusively
 * in `public.integrations` and is read through `repositories/integrations`.
 * Adding a real integration in the future only ever means adding a row here
 * plus a destination handler — never touching the CRM. */
export interface IntegrationProviderMeta {
  provider: string;
  category: IntegrationCategory;
  name: string;
  description: string;
}

export const INTEGRATION_PROVIDERS: IntegrationProviderMeta[] = [
  {
    provider: "meta_ads",
    category: "publicidade",
    name: "Meta Ads",
    description:
      "Conecte campanhas do Facebook e Instagram Ads para sincronizar leads e conversões.",
  },
  {
    provider: "google_ads",
    category: "publicidade",
    name: "Google Ads",
    description: "Sincronize conversões e público-alvo diretamente com o Google Ads.",
  },
  {
    provider: "tiktok_ads",
    category: "publicidade",
    name: "TikTok Ads",
    description: "Envie eventos de conversão para campanhas do TikTok Ads.",
  },
  {
    provider: "linkedin_ads",
    category: "publicidade",
    name: "LinkedIn Ads",
    description: "Conecte campanhas B2B do LinkedIn Ads ao funil comercial.",
  },
  {
    provider: "microsoft_ads",
    category: "publicidade",
    name: "Microsoft Ads",
    description: "Sincronize conversões com o Microsoft Advertising (Bing Ads).",
  },
  {
    provider: "ga4",
    category: "analytics",
    name: "Google Analytics 4",
    description: "Envie eventos de negócio para o GA4 via Measurement Protocol.",
  },
  {
    provider: "gtm",
    category: "analytics",
    name: "Google Tag Manager",
    description: "Gerencie tags e disparos de eventos do Brusync OS.",
  },
  {
    provider: "search_console",
    category: "analytics",
    name: "Google Search Console",
    description: "Acompanhe desempenho orgânico e indexação do site.",
  },
  {
    provider: "clarity",
    category: "analytics",
    name: "Microsoft Clarity",
    description: "Sessões e mapas de calor para entender o comportamento do visitante.",
  },
  {
    provider: "whatsapp",
    category: "comunicacao",
    name: "WhatsApp Business",
    description: "Envie notificações automáticas de leads e tarefas pelo WhatsApp.",
  },
  {
    provider: "slack",
    category: "comunicacao",
    name: "Slack",
    description: "Receba alertas de leads, tarefas e campanhas em canais do Slack.",
  },
  {
    provider: "discord",
    category: "comunicacao",
    name: "Discord",
    description: "Envie notificações da operação comercial para um servidor Discord.",
  },
  {
    provider: "gmail",
    category: "comunicacao",
    name: "Gmail",
    description: "Sincronize e envie e-mails do funil comercial pelo Gmail.",
  },
  {
    provider: "outlook",
    category: "comunicacao",
    name: "Outlook",
    description: "Sincronize e envie e-mails do funil comercial pelo Outlook.",
  },
  {
    provider: "n8n",
    category: "automacao",
    name: "N8N",
    description: "Dispare workflows customizados do N8N a partir de eventos do Brusync.",
  },
  {
    provider: "make",
    category: "automacao",
    name: "Make",
    description: "Conecte o Brusync a milhares de apps via cenários do Make (antigo Integromat).",
  },
  {
    provider: "zapier",
    category: "automacao",
    name: "Zapier",
    description: "Dispare Zaps automaticamente a partir de eventos do CRM.",
  },
  {
    provider: "api",
    category: "developer",
    name: "API Brusync",
    description: "Acesso programático de leitura e escrita aos dados do Brusync OS.",
  },
  {
    provider: "webhook",
    category: "developer",
    name: "Webhooks",
    description: "Receba eventos do Brusync em tempo real no seu próprio endpoint.",
  },
  {
    provider: "sdk",
    category: "developer",
    name: "SDK",
    description: "Bibliotecas cliente para integrar o Brusync a aplicações próprias.",
  },
];

export function getProviderMeta(provider: string): IntegrationProviderMeta | undefined {
  return INTEGRATION_PROVIDERS.find((p) => p.provider === provider);
}
