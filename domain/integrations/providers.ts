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
    category: "marketing",
    name: "Meta Ads",
    description:
      "Conecte campanhas do Facebook e Instagram Ads para sincronizar leads e conversões.",
  },
  {
    provider: "google_ads",
    category: "marketing",
    name: "Google Ads",
    description: "Sincronize conversões e público-alvo diretamente com o Google Ads.",
  },
  {
    provider: "tiktok_ads",
    category: "marketing",
    name: "TikTok Ads",
    description: "Envie eventos de conversão para campanhas do TikTok Ads.",
  },
  {
    provider: "linkedin_ads",
    category: "marketing",
    name: "LinkedIn Ads",
    description: "Conecte campanhas B2B do LinkedIn Ads ao funil comercial.",
  },
  {
    provider: "microsoft_ads",
    category: "marketing",
    name: "Microsoft Ads",
    description: "Sincronize conversões com o Microsoft Advertising (Bing Ads).",
  },
  {
    provider: "ga4",
    category: "marketing",
    name: "Google Analytics 4",
    description: "Envie eventos de negócio para o GA4 via Measurement Protocol.",
  },
  {
    provider: "gtm",
    category: "marketing",
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
    description: "Envie e receba mensagens de leads e clientes pelo WhatsApp Business.",
  },
  {
    provider: "evolution_api",
    category: "comunicacao",
    name: "Evolution API",
    description: "Conecte um número de WhatsApp via gateway self-hosted Evolution API.",
  },
  {
    provider: "messenger",
    category: "comunicacao",
    name: "Messenger",
    description: "Receba e responda mensagens do Facebook Messenger na Central de Comunicação.",
  },
  {
    provider: "instagram_direct",
    category: "comunicacao",
    name: "Instagram Direct",
    description: "Receba e responda mensagens diretas do Instagram na Central de Comunicação.",
  },
  {
    provider: "smtp",
    category: "comunicacao",
    name: "E-mail SMTP",
    description: "Envie e-mails transacionais e de notificação por um servidor SMTP próprio.",
  },
  {
    provider: "resend",
    category: "comunicacao",
    name: "Resend",
    description: "Envie e-mails transacionais através da API do Resend.",
  },
  {
    provider: "sendgrid",
    category: "comunicacao",
    name: "SendGrid",
    description: "Envie e-mails transacionais e de marketing através do SendGrid.",
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
    provider: "webhook",
    category: "automacao",
    name: "Webhooks",
    description: "Receba eventos do Brusync em tempo real no seu próprio endpoint.",
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
    provider: "n8n",
    category: "automacao",
    name: "N8N",
    description: "Dispare workflows customizados do N8N a partir de eventos do Brusync.",
  },
  {
    provider: "openai",
    category: "ia",
    name: "OpenAI",
    description: "Utilize modelos da OpenAI para recursos de inteligência artificial do Brusync.",
  },
  {
    provider: "claude",
    category: "ia",
    name: "Claude",
    description: "Utilize modelos Claude (Anthropic) para recursos de inteligência artificial.",
  },
  {
    provider: "gemini",
    category: "ia",
    name: "Gemini",
    description: "Utilize modelos Gemini (Google) para recursos de inteligência artificial.",
  },
  {
    provider: "supabase",
    category: "infraestrutura",
    name: "Supabase",
    description: "Banco de dados e autenticação — infraestrutura principal do Brusync OS.",
  },
  {
    provider: "storage",
    category: "infraestrutura",
    name: "Storage",
    description: "Armazenamento de arquivos e documentos anexados no Brusync OS.",
  },
  {
    provider: "vercel",
    category: "infraestrutura",
    name: "Vercel",
    description: "Hospedagem e deploy da aplicação web do Brusync OS.",
  },
  {
    provider: "api",
    category: "developer",
    name: "API Brusync",
    description: "Acesso programático de leitura e escrita aos dados do Brusync OS.",
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
