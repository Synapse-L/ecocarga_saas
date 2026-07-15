-- Create a table for user profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'vendedor',
  completed_tour BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for clients
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for templates
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for proposals
CREATE TABLE proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients ON DELETE SET NULL,
  template_id UUID REFERENCES templates ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'Rascunho', -- Rascunho, Enviado, Concluído, Vencido
  commercial_data JSONB NOT NULL, -- The structure from ProposalData type
  final_pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Helper security function to check if user is admin (bypasses RLS recursion)
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

-- Policies for profiles
CREATE POLICY "Users can view own or admin views all" ON profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own or admin updates all" ON profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Policies for clients
CREATE POLICY "Users can manage own clients" ON clients FOR ALL USING (auth.uid() = user_id);

-- Policies for templates
CREATE POLICY "Users can manage own templates" ON templates FOR ALL USING (auth.uid() = user_id);

-- Policies for proposals
CREATE POLICY "Users can manage own proposals" ON proposals FOR ALL USING (auth.uid() = user_id);

-- Storage buckets
-- Note: You need to create 'templates' and 'proposals' buckets manually in Supabase Dashboard
-- and set them to public or add appropriate policies.
