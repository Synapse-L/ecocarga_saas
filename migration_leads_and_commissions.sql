-- =============================================================
-- MIGRATION: Leads e Commissions
-- EcoCarga SaaS — Fase 3: Persistência real no Supabase
--
-- COMO RODAR:
-- 1. Acesse o Supabase Dashboard (https://supabase.com)
-- 2. Vá em SQL Editor → New Query
-- 3. Cole todo o conteúdo deste arquivo
-- 4. Clique em "Run" (ou Ctrl+Enter)
--
-- É seguro rodar mais de uma vez: policies e triggers são recriadas.
-- =============================================================

-- 1. Tabela de Leads (CRM WhatsApp)
CREATE TABLE IF NOT EXISTS leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  phone           text,
  interest        text,
  status          text NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'inprogress', 'qualified', 'proposal', 'closed')),
  origin          text NOT NULL DEFAULT 'whatsapp'
                    CHECK (origin IN ('whatsapp', 'instagram', 'site', 'indicacao')),
  score           int DEFAULT 50 CHECK (score >= 0 AND score <= 100),
  tags            text[] DEFAULT '{}',
  first_msg       text,
  timeline        jsonb DEFAULT '[]',
  converted_to_client boolean DEFAULT false,
  proposal_id     uuid REFERENCES proposals(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON leads(user_id);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
CREATE POLICY "Users can view their own leads"
  ON leads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;
CREATE POLICY "Users can insert their own leads"
  ON leads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
CREATE POLICY "Users can update their own leads"
  ON leads FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own leads" ON leads;
CREATE POLICY "Users can delete their own leads"
  ON leads FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para updated_at.
-- search_path fixo: exigência do Security Advisor para qualquer função nossa,
-- e o mesmo cuidado já aplicado em is_admin() no setup.sql.
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_leads_updated_at();

-- =============================================================

-- 2. Tabela de Comissões
CREATE TABLE IF NOT EXISTS commissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal_id     uuid REFERENCES proposals(id) ON DELETE SET NULL,
  client          text NOT NULL,
  product         text NOT NULL,
  deal_value      numeric(12, 2) NOT NULL DEFAULT 0,
  comm_percent    numeric(5, 2) NOT NULL DEFAULT 5,

  -- Coluna GERADA: o valor da comissão não é gravado, é derivado. Comissão é
  -- dinheiro que alguém vai receber; um valor que discorde de
  -- (venda × percentual) não teria como ser percebido olhando a tela.
  -- Consequência para quem escreve no banco: nunca envie comm_value num
  -- INSERT ou UPDATE — o Postgres recusa.
  comm_value      numeric(12, 2) GENERATED ALWAYS AS (ROUND(deal_value * comm_percent / 100, 2)) STORED,

  status          text NOT NULL DEFAULT 'processando'
                    CHECK (status IN ('pago', 'processando', 'retido')),
  paid_at         timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS commissions_user_id_idx ON commissions(user_id);
CREATE INDEX IF NOT EXISTS commissions_status_idx ON commissions(status);
CREATE INDEX IF NOT EXISTS commissions_proposal_id_idx ON commissions(proposal_id);

-- RLS
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own commissions" ON commissions;
CREATE POLICY "Users can view their own commissions"
  ON commissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admin enxerga a comissão de todo mundo. Usa is_admin(), e não uma subconsulta
-- em profiles: a função é SECURITY DEFINER e não reentra na RLS de profiles,
-- que é o que evita recursão de policy.
DROP POLICY IF EXISTS "Admins can view all commissions" ON commissions;
CREATE POLICY "Admins can view all commissions"
  ON commissions FOR SELECT TO authenticated
  USING (public.is_admin());

-- Vendedor não cria nem edita a própria comissão: quem lança é a gestão.
DROP POLICY IF EXISTS "Admins can insert commissions" ON commissions;
CREATE POLICY "Admins can insert commissions"
  ON commissions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update commissions" ON commissions;
CREATE POLICY "Admins can update commissions"
  ON commissions FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_commissions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS commissions_updated_at ON commissions;
CREATE TRIGGER commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW EXECUTE FUNCTION update_commissions_updated_at();

-- =============================================================

-- 3. Adicionar lead_id em proposals (rastreamento de conversão)
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS proposals_lead_id_idx ON proposals(lead_id);

-- =============================================================
-- FIM DA MIGRATION
-- =============================================================
