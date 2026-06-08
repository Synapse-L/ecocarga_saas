-- Table for charger models
CREATE TABLE charger_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE, -- NULL means global/system-wide model
  name TEXT NOT NULL,
  power TEXT NOT NULL,
  price NUMERIC NOT NULL,
  power_source TEXT NOT NULL,
  connectors INTEGER NOT NULL DEFAULT 1,
  connector_type TEXT NOT NULL DEFAULT 'CCS2',
  communication TEXT NOT NULL,
  model_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE charger_models ENABLE ROW LEVEL SECURITY;

-- Policy for viewing charger models: Everyone (authenticated users) can view global models AND their own models
CREATE POLICY "Users can view charger models" 
ON charger_models 
FOR SELECT 
USING (user_id IS NULL OR auth.uid() = user_id);

-- Policy for managing charger models: Users can manage (insert, update, delete) their own models
CREATE POLICY "Users can manage own charger models" 
ON charger_models 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Insert default system-wide (global) charger models
INSERT INTO charger_models (name, power, price, power_source, connectors, connector_type, communication, model_name)
VALUES 
('Eco SuperFast', '40kW', 30966.36, '3F+N+T', 1, 'CCS2', 'Bluetooth/Wi-Fi/Ethernet/RFID/4G', 'Rise Superfast'),
('Eco Fast', '22kW', 18500.00, '3F+N+T', 1, 'Tipo 2', 'Bluetooth/Wi-Fi/Ethernet', 'Rise Fast'),
('Eco Wallbox', '7.4kW', 4890.00, '220V Mono/Bifásico', 1, 'Tipo 2', 'Wi-Fi/OCPP 1.6j', 'Rise Wallbox');
