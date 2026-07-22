-- ============================================================================
-- Brusync OS — Fase 9: integração real com a Meta Conversions API.
--
-- Aditivo apenas — nenhuma tabela é removida. Reaproveita toda a
-- infraestrutura das Fases 6-8: o provider "meta_ads" já existe em
-- public.integrations, a fila já existe em public.conversion_deliveries e o
-- histórico de tentativas já existe em public.conversion_delivery_attempts.
-- Esta migration só (1) alarga o status da fila para incluir "enviando" e
-- "reprocessando", (2) adiciona onde guardar o Access Token do Meta
-- criptografado (nunca em texto puro) e (3) adiciona onde guardar o payload
-- enviado e a resposta da Meta em cada tentativa, para a tela de Logs.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Fila de envio: "Pendente, Enviando, Enviado, Falhou, Reprocessando".
-- O nome da constraint de check é recriado dinamicamente (em vez de
-- "drop constraint <nome fixo>") porque o Postgres escolhe o nome
-- automaticamente quando a Fase 8 criou a tabela sem nomear a constraint.
-- ----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
    where rel.relname = 'conversion_deliveries'
      and con.contype = 'c'
      and att.attname = 'status'
  loop
    execute format('alter table public.conversion_deliveries drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.conversion_deliveries
  add constraint conversion_deliveries_status_check
  check (status in ('pendente', 'enviando', 'enviado', 'falhou', 'reprocessando'));

-- ----------------------------------------------------------------------------
-- 2) Credenciais do Meta Pixel — Pixel ID e Test Event Code não são segredo
-- (guardados em integrations.config, já existente desde a Fase 6). O Access
-- Token é segredo e nunca é gravado em texto puro: fica criptografado
-- (AES-256-GCM) com a chave do servidor (env META_TOKEN_ENCRYPTION_KEY,
-- nunca no banco, nunca no frontend) — ver services/metaConversionsApi/
-- tokenCrypto.ts. Sem essa chave, ninguém com acesso ao banco consegue ler
-- o token, mesmo com a service role key.
-- ----------------------------------------------------------------------------
alter table public.integrations add column if not exists access_token_ciphertext text;
alter table public.integrations add column if not exists access_token_iv text;

-- ----------------------------------------------------------------------------
-- 3) Histórico de tentativas: agora também guarda o payload exato enviado e
-- o corpo da resposta da Meta (ou do erro), para a tela de Logs mostrar
-- "visualizar payload enviado" / "visualizar resposta da Meta" com dados
-- reais — nunca resumos fabricados.
-- ----------------------------------------------------------------------------
alter table public.conversion_delivery_attempts add column if not exists request_payload jsonb;
alter table public.conversion_delivery_attempts add column if not exists response_body jsonb;
alter table public.conversion_delivery_attempts add column if not exists http_status integer;
