-- ============================================================
-- MIGRAÇÃO: Integração de CRM (Clientes) & Leads
-- EcoCarga SaaS
-- 
-- COMO RODAR:
-- 1. Acesse o Supabase Dashboard (https://supabase.com)
-- 2. Vá em SQL Editor → New Query
-- 3. Cole todo o conteúdo deste arquivo
-- 4. Clique em "Run" (ou Ctrl+Enter)
-- ============================================================

-- Adiciona novas colunas à tabela clients para suportar dados de CRM e Leads
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'condominio',
  ADD COLUMN IF NOT EXISTS potential TEXT DEFAULT 'morno',
  ADD COLUMN IF NOT EXISTS is_lead BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS lead_origin TEXT DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS first_msg TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;

-- Cria índices para buscas rápidas (filtros)
CREATE INDEX IF NOT EXISTS clients_is_lead_idx ON clients(is_lead);
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);

-- ✅ Pronto! A tabela de clientes agora está preparada para armazenar leads e dados detalhados de CRM.
