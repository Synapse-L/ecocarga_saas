-- ============================================================
-- MIGRAÇÃO: Link Público + Assinatura Digital
-- ProposalPro — Kepler's Proposal
-- 
-- COMO RODAR:
-- 1. Acesse o Supabase Dashboard → SQL Editor
-- 2. Cole todo o conteúdo deste arquivo
-- 3. Clique em "Run" (ou pressione Ctrl+Enter)
-- ============================================================

-- Adiciona colunas de link público e assinatura na tabela proposals
ALTER TABLE proposals 
  ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS client_signed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS client_signature TEXT;

-- Cria índice para busca rápida por token
CREATE UNIQUE INDEX IF NOT EXISTS proposals_public_token_idx 
  ON proposals(public_token) WHERE public_token IS NOT NULL;

-- Permite leitura pública de propostas com is_public = true
-- (necessário para a página /p/[token] funcionar sem login)
DROP POLICY IF EXISTS "Public can view public proposals" ON proposals;
CREATE POLICY "Public can view public proposals" 
  ON proposals FOR SELECT 
  USING (is_public = true);

-- Permite a service role (API route) atualizar assinatura
-- (já coberto pelo service role key — sem policy adicional necessária)

-- ✅ Pronto! Agora o sistema suporta links públicos e assinaturas digitais.
