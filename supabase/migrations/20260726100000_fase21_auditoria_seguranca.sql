-- ============================================================================
-- Brusync OS — Fase 21: Auditoria de Segurança, Arquitetura e Cybersecurity.
--
-- Único achado de banco que exigiu correção: profiles nunca teve uma policy
-- de select para "equipe interna lê outros perfis da equipe" — só existiam
-- "Usuários podem ver o próprio perfil" (auth.uid() = id) e a policy do
-- Portal do Cliente (equipe vista através de um projeto do próprio cliente).
-- Isso quebrava, silenciosamente, dois recursos que fazem select direto em
-- profiles filtrando por role:
--   - listOwnerOptions() (repositories/crm/leadsRepository.ts), usada nos
--     seletores de "Responsável" de Leads e Clientes;
--   - a dimensão "autor" da busca global da Base de Conhecimento
--     (services/knowledge/knowledgeSearchService.ts).
-- Sob RLS, cada usuário só enxergava a própria linha — os dois recursos
-- listavam/buscavam apenas o próprio usuário logado, nunca os colegas.
--
-- Mesmo padrão "Equipe interna lê X" já usado em todas as outras tabelas,
-- via is_internal_staff() (security definer, sem risco de recursão).
-- ============================================================================

drop policy if exists "Equipe interna lê profiles da equipe" on public.profiles;
create policy "Equipe interna lê profiles da equipe"
  on public.profiles for select
  using (public.is_internal_staff());
