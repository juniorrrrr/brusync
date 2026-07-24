-- ============================================================================
-- Brusync OS — Fase 16: Central de Integrações.
--
-- Aditivo apenas, evoluindo o módulo de Integrações já existente desde a
-- Fase 9 (public.integrations/integration_logs/integration_events e o board/
-- drawer em app/(crm)/(app)/integracoes) em vez de duplicá-lo — a própria
-- Fase 16 pede "nenhuma configuração espalhada pelo sistema", e um catálogo
-- paralelo seria exatamente isso. Nenhuma tabela nova é criada aqui.
--
-- Duas mudanças de dado, ambas seguras de rodar de novo:
--   1) Recategoriza linhas existentes para o vocabulário de categorias da
--      Fase 16 (Marketing/Comunicação/Automação/IA/Infraestrutura) — mantém
--      "analytics" e "developer" para os poucos providers que não couberam
--      em nenhuma das 5 categorias pedidas (Search Console, Clarity, API,
--      SDK), sem removê-los do catálogo.
--   2) Insere as 12 novas linhas de catálogo pedidas pela Fase 16 (Evolution
--      API, Messenger, Instagram Direct, E-mail SMTP, Resend, SendGrid,
--      OpenAI, Claude, Gemini, Supabase, Storage, Vercel) — todas
--      'em_desenvolvimento', desabilitadas, sem nenhuma credencial real,
--      mesmo padrão do seed original da Fase 9.
-- ============================================================================

alter table public.integrations drop constraint if exists integrations_category_check;

update public.integrations set category = 'marketing'
  where provider in ('meta_ads', 'google_ads', 'tiktok_ads', 'linkedin_ads', 'microsoft_ads', 'ga4', 'gtm');

update public.integrations set category = 'automacao'
  where provider = 'webhook';

alter table public.integrations add constraint integrations_category_check
  check (category in (
    'marketing', 'analytics', 'comunicacao', 'automacao', 'ia', 'infraestrutura', 'developer'
  ));

update public.integrations
  set description = 'Envie e receba mensagens de leads e clientes pelo WhatsApp Business.'
  where provider = 'whatsapp';

insert into public.integrations (provider, category, name, description, status, enabled)
values
  ('evolution_api', 'comunicacao', 'Evolution API', 'Conecte um número de WhatsApp via gateway self-hosted Evolution API.', 'em_desenvolvimento', false),
  ('messenger', 'comunicacao', 'Messenger', 'Receba e responda mensagens do Facebook Messenger na Central de Comunicação.', 'em_desenvolvimento', false),
  ('instagram_direct', 'comunicacao', 'Instagram Direct', 'Receba e responda mensagens diretas do Instagram na Central de Comunicação.', 'em_desenvolvimento', false),
  ('smtp', 'comunicacao', 'E-mail SMTP', 'Envie e-mails transacionais e de notificação por um servidor SMTP próprio.', 'em_desenvolvimento', false),
  ('resend', 'comunicacao', 'Resend', 'Envie e-mails transacionais através da API do Resend.', 'em_desenvolvimento', false),
  ('sendgrid', 'comunicacao', 'SendGrid', 'Envie e-mails transacionais e de marketing através do SendGrid.', 'em_desenvolvimento', false),
  ('openai', 'ia', 'OpenAI', 'Utilize modelos da OpenAI para recursos de inteligência artificial do Brusync.', 'em_desenvolvimento', false),
  ('claude', 'ia', 'Claude', 'Utilize modelos Claude (Anthropic) para recursos de inteligência artificial.', 'em_desenvolvimento', false),
  ('gemini', 'ia', 'Gemini', 'Utilize modelos Gemini (Google) para recursos de inteligência artificial.', 'em_desenvolvimento', false),
  ('supabase', 'infraestrutura', 'Supabase', 'Banco de dados e autenticação — infraestrutura principal do Brusync OS.', 'em_desenvolvimento', false),
  ('storage', 'infraestrutura', 'Storage', 'Armazenamento de arquivos e documentos anexados no Brusync OS.', 'em_desenvolvimento', false),
  ('vercel', 'infraestrutura', 'Vercel', 'Hospedagem e deploy da aplicação web do Brusync OS.', 'em_desenvolvimento', false)
on conflict (provider) do nothing;
