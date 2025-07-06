
-- Sistem aktiviteleri için log tablosu
CREATE TABLE public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ülkeler tablosu
CREATE TABLE public.countries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(3) NOT NULL UNIQUE,
  phone_code VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Firma tipleri tablosu
CREATE TABLE public.company_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Para birimleri tablosu
CREATE TABLE public.currencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(3) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Marka tablosu
CREATE TABLE public.brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Teklif durumları tablosu
CREATE TABLE public.quotation_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#000000',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Teklif numarası formatları tablosu
CREATE TABLE public.quotation_number_formats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  format_template VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS politikaları
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_number_formats ENABLE ROW LEVEL SECURITY;

-- Activity logs - sadece okunabilir
CREATE POLICY "Users can view activity logs" ON public.activity_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Diğer tablolar için temel CRUD politikaları
CREATE POLICY "Users can view countries" ON public.countries
  FOR SELECT USING (true);

CREATE POLICY "Users can manage company types" ON public.company_types
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view currencies" ON public.currencies
  FOR SELECT USING (true);

CREATE POLICY "Users can manage brands" ON public.brands
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage quotation statuses" ON public.quotation_statuses
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage quotation number formats" ON public.quotation_number_formats
  FOR ALL USING (auth.role() = 'authenticated');

-- Varsayılan veriler ekleme
INSERT INTO public.countries (name, code, phone_code) VALUES
('Türkiye', 'TR', '+90'),
('Amerika Birleşik Devletleri', 'US', '+1'),
('Almanya', 'DE', '+49'),
('Fransa', 'FR', '+33'),
('İngiltere', 'GB', '+44'),
('İtalya', 'IT', '+39'),
('İspanya', 'ES', '+34'),
('Rusya', 'RU', '+7'),
('Çin', 'CN', '+86'),
('Japonya', 'JP', '+81');

INSERT INTO public.company_types (name, description) VALUES
('Müşteri', 'Müşteri firması'),
('Tedarikçi', 'Tedarikçi firması'),
('Bayi', 'Bayi firması'),
('Ortak', 'İş ortağı firması');

INSERT INTO public.currencies (code, name, symbol) VALUES
('TRY', 'Türk Lirası', '₺'),
('USD', 'Amerikan Doları', '$'),
('EUR', 'Euro', '€'),
('GBP', 'İngiliz Sterlini', '£');

INSERT INTO public.quotation_statuses (name, description, color) VALUES
('Taslak', 'Hazırlanmakta olan teklif', '#6B7280'),
('Gönderildi', 'Müşteriye gönderilen teklif', '#3B82F6'),
('Kabul Edildi', 'Müşteri tarafından kabul edilen teklif', '#10B981'),
('Reddedildi', 'Müşteri tarafından reddedilen teklif', '#EF4444'),
('İptal Edildi', 'İptal edilen teklif', '#F59E0B');

INSERT INTO public.quotation_number_formats (format_template, description) VALUES
('TEK-{YYYY}-{MM}-{####}', 'TEK-2024-01-0001 formatı'),
('QUO-{####}', 'QUO-0001 formatı'),
('T{YY}{MM}{####}', 'T240100001 formatı');

-- Activity log fonksiyonu
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action VARCHAR(100),
  p_table_name VARCHAR(50),
  p_record_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.activity_logs (
    user_id, action, table_name, record_id, description
  ) VALUES (
    auth.uid(), p_action, p_table_name, p_record_id, p_description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
