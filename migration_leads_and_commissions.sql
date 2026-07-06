-- =============================================================
-- MIGRATION: Leads e Commissions
-- EcoCarga SaaS — Fase 3: Persistência real no Supabase
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

CREATE POLICY "Users can view their own leads"
  ON leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
  ON leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
  ON leads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
  ON leads FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE POLICY "Users can view their own commissions"
  ON commissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all commissions"
  ON commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert commissions"
  ON commissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'gestor')
    )
  );

CREATE POLICY "Admins can update commissions"
  ON commissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'gestor')
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
-- Execute este arquivo no SQL Editor do Supabase Dashboard
-- =============================================================
