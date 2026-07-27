-- ============================================================
-- MIGRATION: ADMIN PODE GERENCIAR MODELOS DE FÁBRICA
-- Execute este script no SQL Editor do painel do Supabase.
-- ============================================================
--
-- PROBLEMA
-- Os 3 carregadores criados na instalação (Eco SuperFast, Eco Fast,
-- Eco Wallbox) têm user_id = NULL — são "de fábrica", compartilhados por
-- todos os vendedores. A única policy de escrita existente é:
--
--     USING (auth.uid() = user_id)
--
-- e NULL nunca é igual a auth.uid(). Resultado: ninguém consegue editar
-- nem excluir esses modelos. Como não dá para editar, também não dá para
-- anexar a foto do carregador — por isso a página 6 continuava mostrando
-- o desenho vetorial embutido em vez da imagem.
--
-- SOLUÇÃO
-- Uma policy adicional que libera o admin a gerenciar apenas as linhas
-- de fábrica (user_id IS NULL). Policies no Postgres são somadas (OR),
-- então a regra existente para modelos próprios continua valendo igual.

CREATE POLICY "Admins can manage global charger models"
ON public.charger_models
FOR ALL
TO authenticated
USING      (user_id IS NULL AND public.is_admin())
WITH CHECK (user_id IS NULL AND public.is_admin());

-- Conferir se aplicou:
--   SELECT policyname, cmd FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'charger_models';
--
-- Devem aparecer 3 policies: view / manage own / manage global (admin).

-- ------------------------------------------------------------
-- LEMBRETE: isto só funciona se o seu usuário for admin.
-- Para se promover (troque pelo seu e-mail de login):
--
--   UPDATE public.profiles SET role = 'admin'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'seu-email@aqui.com');
--
-- Depois saia e entre de novo no sistema.
-- ------------------------------------------------------------
