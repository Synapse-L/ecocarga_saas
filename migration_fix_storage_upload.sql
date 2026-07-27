-- ============================================================
-- CORREÇÃO: UPLOAD NO BUCKET "templates" VOLTOU A DAR
--           "new row violates row-level security policy"
-- Execute no SQL Editor do painel do Supabase.
-- ============================================================
--
-- O QUE ACONTECEU
-- Na migration_security_hardening.sql removemos duas policies do bucket
-- `templates` para resolver o aviso "Public Bucket Allows Listing":
--
--     DROP POLICY "Permitir leitura pública"          ON storage.objects;
--     DROP POLICY "Authenticated users can read templates" ON storage.objects;
--
-- Assumimos que ambas eram apenas de SELECT (leitura). Se a policy
-- "Permitir leitura pública" tinha sido criada no painel como FOR ALL —
-- padrão de vários templates de policy do Supabase — ela também concedia
-- INSERT. Ao removê-la, o upload de arquivos parou: toda gravação em
-- storage.objects passou a ser recusada pelo RLS.
--
-- Isto afeta:
--   • Admin -> Carregadores -> anexar foto do carregador
--   • Admin -> Templates    -> subir PDF de template
--
-- DIAGNÓSTICO (opcional, rode antes para ver o estado atual)
--   SELECT policyname, cmd, roles FROM pg_policies
--   WHERE schemaname = 'storage' AND tablename = 'objects';

-- ------------------------------------------------------------
-- CORREÇÃO: permissões de escrita explícitas para usuários logados.
-- Mais restrito que a policy original (que era pública): aqui só quem
-- está autenticado escreve, e apenas dentro do bucket `templates`.
-- Continua SEM policy de SELECT, então a listagem dos arquivos segue
-- fechada e o aviso do Security Advisor não volta. O download por URL
-- não é afetado porque o bucket é público e não passa por RLS.
-- ------------------------------------------------------------

-- Enviar arquivo novo (upload)
DROP POLICY IF EXISTS "Authenticated can upload to templates" ON storage.objects;
CREATE POLICY "Authenticated can upload to templates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'templates');

-- Sobrescrever arquivo existente — o app faz upload com upsert: true
DROP POLICY IF EXISTS "Authenticated can update templates" ON storage.objects;
CREATE POLICY "Authenticated can update templates"
ON storage.objects FOR UPDATE
TO authenticated
USING      (bucket_id = 'templates')
WITH CHECK (bucket_id = 'templates');

-- Remover arquivo (exclusão de template/modelo)
DROP POLICY IF EXISTS "Authenticated can delete from templates" ON storage.objects;
CREATE POLICY "Authenticated can delete from templates"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'templates');

-- Conferir o resultado:
--   SELECT policyname, cmd FROM pg_policies
--   WHERE schemaname = 'storage' AND tablename = 'objects';
-- Esperado: 3 policies (INSERT / UPDATE / DELETE), nenhuma de SELECT.
