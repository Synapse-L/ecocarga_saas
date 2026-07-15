-- ============================================================
-- MIGRATION: SECURITY HARDENING (Security Advisor warnings)
-- Execute este script no SQL Editor do seu painel do Supabase.
-- Corrige: "Function Search Path Mutable" e
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
-- de usuários logados, então "authenticated" PRECISA manter o EXECUTE —
-- o aviso "Signed-In Users Can Execute SECURITY DEFINER Function" é esperado
-- e aceitável para esta função (ela só revela se o próprio chamador é admin).
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. Bucket "templates": remove listagem pública e permite apenas a usuários
-- logados. Antes de rodar, confira o nome real da(s) política(s) existente(s):
--   SELECT policyname, roles, cmd FROM pg_policies
--   WHERE schemaname = 'storage' AND tablename = 'objects';
-- e substitua "Public Access" abaixo pelo nome que aparecer para o SELECT amplo.
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Authenticated users can read templates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'templates');

-- Observação: se o bucket estiver marcado como "Public" no dashboard, o
-- download direto por URL continua funcionando independente de políticas
-- (é assim que o app resolve file_url hoje). Esta política fecha apenas a
-- LISTAGEM dos arquivos. Para fechar também o download seria preciso tornar
-- o bucket privado e trocar getPublicUrl por createSignedUrl no código.

-- 4. "Leaked Password Protection Disabled" não se corrige por SQL:
-- Dashboard -> Authentication -> Passwords -> ativar "Leaked password protection".
