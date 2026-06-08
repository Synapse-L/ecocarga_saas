-- Add image_url column to charger_models table if it does not exist
ALTER TABLE charger_models 
ADD COLUMN IF NOT EXISTS image_url TEXT;
