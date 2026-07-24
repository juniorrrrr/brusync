-- ============================================================================
-- Brusync OS — Fase 19: Inteligência Operacional (Business Intelligence
-- Engine).
--
-- Aditivo apenas — nenhuma tabela existente é alterada. Este motor NÃO
-- duplica dados: ele lê CRM/Pipeline/Marketing/Financeiro/Projetos/
-- Comunicação/Integrações/Automação/Conversões através das camadas de
-- aplicação/repositório já existentes (application/*, repositories/*) e só
-- persiste aqui o RESULTADO do cálculo — o insight/alerta/score em si, mais
-- a evidência (evidence jsonb) que o originou, nunca os dados brutos de
-- outro módulo.
--
-- Seis tabelas:
--   intelligence_rules         → catálogo configurável de regras (chave,
--                                categoria, severidade padrão, thresholds em
--                                config jsonb) — o motor de cálculo em si
--                                vive em domain/intelligence (nunca no
--                                banco nem em componente React), esta
--                                tabela só parametriza limites (dias,
--                                percentuais) sem exigir novo deploy.
--   intelligence_insights      → observações geradas pelo motor ("Leads
--                                parados acima do esperado", "Campanha X tem
--                                o melhor ROI"...). evidence jsonb guarda os
--                                dados exatos que originaram o cálculo —
--                                nenhum insight é uma caixa preta.
--   intelligence_alerts        → mesma ideia, para situações que exigem
--                                ação (lead sem contato, projeto atrasado,
--                                integração com erro...), com fluxo de
--                                reconhecimento/resolução.
--   intelligence_scores        → série histórica (score_date, category) —
--                                "Evolução histórica" pedida na Fase 19 é
--                                sempre uma consulta nesta tabela ao longo
--                                do tempo, nunca um valor recalculado do
--                                zero para o passado.
--   intelligence_snapshots     → captura diária do conjunto de métricas
--                                operacionais (metrics jsonb) — alimenta
--                                comparativos (hoje/ontem/7d/30d/mês/ano)
--                                sem precisar reprocessar módulos inteiros
--                                para uma data passada.
--   intelligence_notifications → ponte leve para um futuro sino de
--                                notificações — cada linha aponta para um
--                                insight OU alerta (nunca os dois), pode ser
--                                broadcast (user_id nulo) ou por usuário.
-- ============================================================================

-- ----------------------------------------------------------------------------
create table if not exists public.intelligence_rules (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  key text not null,
  name text not null,
  description text,
  category text not null
    check (category in ('comercial', 'marketing', 'financeiro', 'projetos', 'atendimento', 'operacional')),
  kind text not null check (kind in ('insight', 'alerta')),
  severity_default text not null default 'info'
    check (severity_default in ('info', 'atencao', 'critico')),
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,

  created_by uuid references public.profiles (id) on delete set null
);

alter table public.intelligence_rules enable row level security;

create unique index if not exists intelligence_rules_key_idx on public.intelligence_rules (key);

drop trigger if exists set_intelligence_rules_updated_at on public.intelligence_rules;
create trigger set_intelligence_rules_updated_at
  before update on public.intelligence_rules
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê intelligence_rules" on public.intelligence_rules;
create policy "Equipe interna lê intelligence_rules"
  on public.intelligence_rules for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria intelligence_rules" on public.intelligence_rules;
create policy "Equipe interna cria intelligence_rules"
  on public.intelligence_rules for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza intelligence_rules" on public.intelligence_rules;
create policy "Equipe interna atualiza intelligence_rules"
  on public.intelligence_rules for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga intelligence_rules" on public.intelligence_rules;
create policy "Equipe interna apaga intelligence_rules"
  on public.intelligence_rules for delete
  using (public.is_internal_staff());

-- Catálogo de regras — thresholds em domain/intelligence/thresholds.ts são o
-- default de fábrica; esta seed só espelha esses defaults como linhas
-- configuráveis (o motor lê a config daqui quando existir, senão cai no
-- default do domínio).
insert into public.intelligence_rules (key, name, description, category, kind, severity_default, config) values
  ('leads_parados', 'Leads parados acima do esperado', 'Leads em aberto sem interação há mais dias que o esperado.', 'comercial', 'insight', 'atencao', '{"staleDays": 7}'),
  ('responsavel_baixa_conversao', 'Responsável com baixa conversão', 'Responsável comercial com taxa de conversão abaixo da média da equipe.', 'comercial', 'insight', 'atencao', '{"minLeads": 5, "belowAveragePercent": 20}'),
  ('campanha_melhor_roi', 'Campanha com melhor ROI', 'Campanha com o maior retorno sobre investimento no período.', 'marketing', 'insight', 'info', '{}'),
  ('campanha_pior_roi', 'Campanha com pior ROI', 'Campanha com o menor retorno sobre investimento no período.', 'marketing', 'insight', 'atencao', '{}'),
  ('origem_maior_fechamento', 'Origem com maior taxa de fechamento', 'Origem de lead com a maior taxa de conversão em cliente.', 'marketing', 'insight', 'info', '{}'),
  ('origem_maior_ticket', 'Origem com maior ticket médio', 'Origem de lead com o maior ticket médio por cliente.', 'marketing', 'insight', 'info', '{}'),
  ('cliente_parado', 'Cliente parado há muito tempo', 'Cliente sem movimentação financeira ou de projeto há muitos dias.', 'comercial', 'insight', 'atencao', '{"staleDays": 60}'),
  ('projetos_atrasados', 'Projetos atrasados', 'Projetos com prazo vencido e ainda não concluídos.', 'projetos', 'insight', 'atencao', '{}'),
  ('inadimplencia_crescente', 'Financeiro com inadimplência crescente', 'Valor vencido em aberto crescendo em relação ao período anterior.', 'financeiro', 'insight', 'critico', '{"growthPercent": 10}'),
  ('tempo_resposta_subindo', 'Tempo médio de resposta aumentando', 'Tempo médio de resposta da equipe às mensagens recebidas está subindo.', 'atendimento', 'insight', 'atencao', '{"growthPercent": 15}'),
  ('pipeline_congestionado', 'Pipeline congestionado', 'Etapa do funil com volume ou tempo médio muito acima das demais.', 'comercial', 'insight', 'atencao', '{"multiplier": 1.6}'),
  ('queda_conversao', 'Queda de conversão', 'Taxa de conversão caiu em relação ao período anterior.', 'comercial', 'insight', 'atencao', '{"dropPercent": 10}'),
  ('cac_subindo', 'Aumento do CAC', 'Custo de aquisição de cliente subiu em relação ao período anterior.', 'marketing', 'insight', 'atencao', '{"growthPercent": 15}'),
  ('roas_caindo', 'Redução do ROAS', 'Retorno sobre investimento em anúncios caiu em relação ao período anterior.', 'marketing', 'insight', 'atencao', '{"dropPercent": 15}'),
  ('ticket_medio_caindo', 'Redução do Ticket Médio', 'Ticket médio caiu em relação ao período anterior.', 'financeiro', 'insight', 'atencao', '{"dropPercent": 10}'),
  ('ciclo_venda_excessivo', 'Tempo excessivo para fechar negócios', 'Tempo médio até o fechamento está acima do esperado.', 'comercial', 'insight', 'atencao', '{"benchmarkDays": 30}'),
  ('lead_sem_contato', 'Lead sem contato', 'Lead nunca recebeu nenhuma interação registrada.', 'comercial', 'alerta', 'atencao', '{"days": 2}'),
  ('lead_parado_alerta', 'Lead parado', 'Lead em aberto sem qualquer interação há vários dias.', 'comercial', 'alerta', 'critico', '{"days": 10}'),
  ('projeto_atrasado_alerta', 'Projeto atrasado', 'Projeto com prazo vencido.', 'projetos', 'alerta', 'critico', '{}'),
  ('cliente_inadimplente', 'Cliente inadimplente', 'Cliente com lançamento financeiro vencido e não pago.', 'financeiro', 'alerta', 'critico', '{}'),
  ('campanha_sem_conversao', 'Campanha sem conversão', 'Campanha com investimento e nenhum cliente convertido.', 'marketing', 'alerta', 'atencao', '{}'),
  ('campanha_gasto_elevado', 'Campanha com gasto elevado', 'Campanha com investimento alto e retorno muito baixo ou negativo.', 'marketing', 'alerta', 'atencao', '{"roiThreshold": 0}'),
  ('receita_abaixo_media', 'Receita abaixo da média', 'Receita do período abaixo da média histórica recente.', 'financeiro', 'alerta', 'atencao', '{"belowAveragePercent": 15}'),
  ('queda_brusca_vendas', 'Queda brusca nas vendas', 'Vendas do período caíram bruscamente em relação ao período anterior.', 'comercial', 'alerta', 'critico', '{"dropPercent": 25}'),
  ('pipeline_sem_movimentacao', 'Pipeline sem movimentação', 'Nenhuma mudança de etapa registrada no funil recentemente.', 'comercial', 'alerta', 'atencao', '{"days": 3}'),
  ('integracao_com_erro', 'Integração com erro', 'Uma ou mais integrações estão reportando erro.', 'operacional', 'alerta', 'critico', '{}'),
  ('webhook_falhando', 'Webhook falhando', 'Falhas de entrega de eventos via webhook detectadas.', 'operacional', 'alerta', 'critico', '{}'),
  ('api_indisponivel', 'API indisponível', 'Taxa de sucesso das integrações abaixo do aceitável.', 'operacional', 'alerta', 'critico', '{"minSuccessRate": 90}'),
  ('storage_proximo_limite', 'Storage próximo do limite', 'Volume de arquivos armazenados se aproximando do limite configurado.', 'operacional', 'alerta', 'atencao', '{"limitBytes": 1073741824, "warnPercent": 80}'),
  ('falha_automacao', 'Falha recorrente de automação', 'Automações com falhas recorrentes de execução.', 'operacional', 'alerta', 'critico', '{"minFailures": 3}')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
create table if not exists public.intelligence_insights (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  rule_key text references public.intelligence_rules (key) on delete set null,
  type text not null,
  category text not null
    check (category in ('comercial', 'marketing', 'financeiro', 'projetos', 'atendimento', 'operacional')),
  severity text not null default 'info' check (severity in ('info', 'atencao', 'critico')),

  title text not null,
  description text not null,
  metric_value numeric,
  metric_unit text,
  trend text check (trend in ('subindo', 'descendo', 'estavel')),

  related_entity_type text,
  related_entity_id uuid,
  evidence jsonb not null default '[]'::jsonb,

  period_from timestamptz,
  period_to timestamptz,

  status text not null default 'ativo' check (status in ('ativo', 'resolvido', 'ignorado')),
  resolved_at timestamptz,

  created_by uuid references public.profiles (id) on delete set null
);

alter table public.intelligence_insights enable row level security;

create index if not exists intelligence_insights_status_idx on public.intelligence_insights (status);
create index if not exists intelligence_insights_category_idx on public.intelligence_insights (category);
create index if not exists intelligence_insights_type_idx on public.intelligence_insights (type);
create index if not exists intelligence_insights_created_idx on public.intelligence_insights (created_at desc);

drop trigger if exists set_intelligence_insights_updated_at on public.intelligence_insights;
create trigger set_intelligence_insights_updated_at
  before update on public.intelligence_insights
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê intelligence_insights" on public.intelligence_insights;
create policy "Equipe interna lê intelligence_insights"
  on public.intelligence_insights for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria intelligence_insights" on public.intelligence_insights;
create policy "Equipe interna cria intelligence_insights"
  on public.intelligence_insights for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza intelligence_insights" on public.intelligence_insights;
create policy "Equipe interna atualiza intelligence_insights"
  on public.intelligence_insights for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga intelligence_insights" on public.intelligence_insights;
create policy "Equipe interna apaga intelligence_insights"
  on public.intelligence_insights for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
create table if not exists public.intelligence_alerts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  rule_key text references public.intelligence_rules (key) on delete set null,
  type text not null,
  category text not null
    check (category in ('comercial', 'marketing', 'financeiro', 'projetos', 'atendimento', 'operacional')),
  severity text not null default 'atencao' check (severity in ('info', 'atencao', 'critico')),

  title text not null,
  description text not null,

  related_entity_type text,
  related_entity_id uuid,
  evidence jsonb not null default '[]'::jsonb,

  status text not null default 'ativo' check (status in ('ativo', 'reconhecido', 'resolvido')),
  acknowledged_by uuid references public.profiles (id) on delete set null,
  acknowledged_at timestamptz,
  resolved_at timestamptz,

  created_by uuid references public.profiles (id) on delete set null
);

alter table public.intelligence_alerts enable row level security;

create index if not exists intelligence_alerts_status_idx on public.intelligence_alerts (status);
create index if not exists intelligence_alerts_severity_idx on public.intelligence_alerts (severity);
create index if not exists intelligence_alerts_category_idx on public.intelligence_alerts (category);
create index if not exists intelligence_alerts_created_idx on public.intelligence_alerts (created_at desc);

drop trigger if exists set_intelligence_alerts_updated_at on public.intelligence_alerts;
create trigger set_intelligence_alerts_updated_at
  before update on public.intelligence_alerts
  for each row execute function public.set_updated_at();

drop policy if exists "Equipe interna lê intelligence_alerts" on public.intelligence_alerts;
create policy "Equipe interna lê intelligence_alerts"
  on public.intelligence_alerts for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria intelligence_alerts" on public.intelligence_alerts;
create policy "Equipe interna cria intelligence_alerts"
  on public.intelligence_alerts for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza intelligence_alerts" on public.intelligence_alerts;
create policy "Equipe interna atualiza intelligence_alerts"
  on public.intelligence_alerts for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna apaga intelligence_alerts" on public.intelligence_alerts;
create policy "Equipe interna apaga intelligence_alerts"
  on public.intelligence_alerts for delete
  using (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Série histórica de scores — "Evolução histórica" é sempre uma consulta
-- aqui ao longo do tempo, nunca recalculada retroativamente.
-- ----------------------------------------------------------------------------
create table if not exists public.intelligence_scores (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  score_date date not null,
  category text not null
    check (category in ('comercial', 'marketing', 'financeiro', 'operacional', 'atendimento', 'geral')),
  score numeric(5, 2) not null check (score >= 0 and score <= 100),
  explanation text,
  factors jsonb not null default '[]'::jsonb
);

alter table public.intelligence_scores enable row level security;

create unique index if not exists intelligence_scores_date_category_idx
  on public.intelligence_scores (score_date, category);

drop policy if exists "Equipe interna lê intelligence_scores" on public.intelligence_scores;
create policy "Equipe interna lê intelligence_scores"
  on public.intelligence_scores for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria intelligence_scores" on public.intelligence_scores;
create policy "Equipe interna cria intelligence_scores"
  on public.intelligence_scores for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza intelligence_scores" on public.intelligence_scores;
create policy "Equipe interna atualiza intelligence_scores"
  on public.intelligence_scores for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
-- Snapshot diário do conjunto de métricas operacionais — alimenta os
-- comparativos (hoje/ontem/7d/30d/mês/ano) sem reprocessar módulos inteiros
-- para uma data passada.
-- ----------------------------------------------------------------------------
create table if not exists public.intelligence_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  snapshot_date date not null,
  metrics jsonb not null default '{}'::jsonb
);

alter table public.intelligence_snapshots enable row level security;

create unique index if not exists intelligence_snapshots_date_idx on public.intelligence_snapshots (snapshot_date);

drop policy if exists "Equipe interna lê intelligence_snapshots" on public.intelligence_snapshots;
create policy "Equipe interna lê intelligence_snapshots"
  on public.intelligence_snapshots for select
  using (public.is_internal_staff());
drop policy if exists "Equipe interna cria intelligence_snapshots" on public.intelligence_snapshots;
create policy "Equipe interna cria intelligence_snapshots"
  on public.intelligence_snapshots for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza intelligence_snapshots" on public.intelligence_snapshots;
create policy "Equipe interna atualiza intelligence_snapshots"
  on public.intelligence_snapshots for update
  using (public.is_internal_staff())
  with check (public.is_internal_staff());

-- ----------------------------------------------------------------------------
create table if not exists public.intelligence_notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  user_id uuid references public.profiles (id) on delete cascade,
  insight_id uuid references public.intelligence_insights (id) on delete cascade,
  alert_id uuid references public.intelligence_alerts (id) on delete cascade,

  title text not null,
  message text not null,
  read boolean not null default false,
  read_at timestamptz,

  constraint intelligence_notifications_target_check
    check (insight_id is not null or alert_id is not null)
);

alter table public.intelligence_notifications enable row level security;

create index if not exists intelligence_notifications_user_idx on public.intelligence_notifications (user_id, read);

drop policy if exists "Equipe interna lê intelligence_notifications" on public.intelligence_notifications;
create policy "Equipe interna lê intelligence_notifications"
  on public.intelligence_notifications for select
  using (public.is_internal_staff() and (user_id is null or user_id = auth.uid()));
drop policy if exists "Equipe interna cria intelligence_notifications" on public.intelligence_notifications;
create policy "Equipe interna cria intelligence_notifications"
  on public.intelligence_notifications for insert
  with check (public.is_internal_staff());
drop policy if exists "Equipe interna atualiza intelligence_notifications" on public.intelligence_notifications;
create policy "Equipe interna atualiza intelligence_notifications"
  on public.intelligence_notifications for update
  using (public.is_internal_staff() and (user_id is null or user_id = auth.uid()))
  with check (public.is_internal_staff() and (user_id is null or user_id = auth.uid()));
drop policy if exists "Equipe interna apaga intelligence_notifications" on public.intelligence_notifications;
create policy "Equipe interna apaga intelligence_notifications"
  on public.intelligence_notifications for delete
  using (public.is_internal_staff());
