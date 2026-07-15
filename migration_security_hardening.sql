-- ============================================================
-- MIGRATION: SECURITY HARDENING (Security Advisor warnings)
-- Execute este script no SQL Editor do seu painel do Supabase.
-- Corrige: "Function Search Path Mutable"
--          "Public Can Execute SECURITY DEFINER Function"
--          "Public Bucket Allows Listing" (bucket templates)
-- ============================================================

-- 1. Recria is_admin() com search_path fixo.
-- SECURITY DEFINER sem search_path fixo permite, em teoria, sequestro de
-- resolução de nomes via schemas graváveis. Com search_path = '' toda
-- referência precisa ser qualificada (public.profiles, auth.uid()) — como já é.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 2. Restringe quem pode executar a função.
-- Por padrão o Postgres concede EXECUTE a PUBLIC (inclui anon).
-- As políticas de RLS de public.profiles chamam is_admin() durante consultas
-- de usuários logados, então "authenticated" PRECISA manter o EXECUTE.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. Bucket "templates": remove TODAS as políticas de SELECT em storage.objects.
-- O bucket é público: o download por URL (getPublicUrl, usado pelo app) não
-- passa por RLS e continua funcionando sem nenhuma política de SELECT.
-- O app nunca chama storage.list() — a listagem de templates vem da tabela
-- public.templates — então nenhuma política de leitura é necessária aqui.
-- As políticas de INSERT/UPDATE/DELETE (upload dos vendedores) não são tocadas.
DROP POLICY IF EXISTS "Permitir leitura pública" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read templates" ON storage.objects;

-- 4. "Leaked Password Protection Disabled" não se corrige por SQL:
-- Dashboard -> Authentication -> Passwords -> ativar "Leaked password protection".

-- ============================================================
-- OPCIONAL: zerar o aviso "Signed-In Users Can Execute SECURITY
-- DEFINER Function" movendo is_admin() para um schema privado,
-- fora da API REST (/rest/v1/rpc). As políticas de RLS continuam
-- funcionando; a função apenas deixa de ser chamável via HTTP.
-- Rode este bloco inteiro de uma vez.
-- ============================================================
-- CREATE SCHEMA IF NOT EXISTS private;
--
-- CREATE OR REPLACE FUNCTION private.is_admin()
-- RETURNS BOOLEAN
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $$
-- BEGIN
--   RETURN EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE id = auth.uid() AND role = 'admin'
--   );
-- END;
-- $$;
--
-- REVOKE EXECUTE ON FUNCTION private.is_admin() FROM PUBLIC;
-- REVOKE EXECUTE ON FUNCTION private.is_admin() FROM anon;
-- GRANT USAGE ON SCHEMA private TO authenticated;
-- GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
--
-- -- Recria as políticas de profiles apontando para o novo schema
-- DROP POLICY IF EXISTS "Users can view own or admin views all" ON public.profiles;
-- DROP POLICY IF EXISTS "Users can update own or admin updates all" ON public.profiles;
--
-- CREATE POLICY "Users can view own or admin views all"
-- ON public.profiles FOR SELECT
-- USING (auth.uid() = id OR private.is_admin());
--
-- CREATE POLICY "Users can update own or admin updates all"
-- ON public.profiles FOR UPDATE
-- USING (auth.uid() = id OR private.is_admin());
--
-- -- Remove a função antiga do schema exposto
-- DROP FUNCTION public.is_admin();
