-- ============================================================
-- MIGRATION: ROLES AND TOUR INDIVIDUALIZATION
-- Execute este script no SQL Editor do seu painel do Supabase.
-- ============================================================

-- 1. Adiciona as novas colunas à tabela public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'vendedor',
ADD COLUMN IF NOT EXISTS completed_tour BOOLEAN DEFAULT false;

-- 2. Cria a função de segurança para verificar se o usuário é administrador.
-- O parâmetro "SECURITY DEFINER" faz a função rodar com privilégios de criador,
-- evitando loops infinitos de leitura RLS (recursão).
-- search_path fixo + EXECUTE restrito: exigências do Security Advisor para SECURITY DEFINER
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

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. Atualiza as políticas de RLS da tabela de perfis
-- Remove as políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own or admin views all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own or admin updates all" ON public.profiles;

-- Cria políticas flexíveis que permitem o usuário ver o próprio perfil OU o Administrador ver todos
CREATE POLICY "Users can view own or admin views all" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own or admin updates all" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id OR public.is_admin());
