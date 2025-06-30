
-- Fuarlara maliyet takibi alanları ekleyelim
ALTER TABLE exhibitions 
ADD COLUMN IF NOT EXISTS target_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_currency TEXT DEFAULT 'TRY';

-- Tema ayarları için company_settings tablosuna örnek veriler ekleyelim
INSERT INTO company_settings (setting_type, name, value, language) 
VALUES 
  ('theme', 'primary_color', '"#1f2937"', 'TR'),
  ('theme', 'secondary_color', '"#6b7280"', 'TR')
ON CONFLICT DO NOTHING;
