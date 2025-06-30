
-- Para birimleri için enum oluştur
CREATE TYPE currency_type AS ENUM ('EUR', 'USD', 'TRY');

-- Teklif dilleri için enum
CREATE TYPE quotation_language AS ENUM ('TR', 'EN', 'PL', 'FR', 'RU', 'DE', 'AR');

-- Quotations tablosunu güncelleyelim
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS quotation_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS language quotation_language DEFAULT 'TR',
ADD COLUMN IF NOT EXISTS prepared_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_quotation_id UUID REFERENCES quotations(id);

-- Ürün matrisleri için tablo
CREATE TABLE IF NOT EXISTS product_matrices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parameter_count INTEGER CHECK (parameter_count IN (2, 3, 4)),
    parameter_1_name TEXT,
    parameter_2_name TEXT,
    parameter_3_name TEXT,
    parameter_4_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Matris değerleri için tablo
CREATE TABLE IF NOT EXISTS matrix_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matrix_id UUID REFERENCES product_matrices(id) ON DELETE CASCADE,
    param_1_value TEXT,
    param_2_value TEXT,
    param_3_value TEXT,
    param_4_value TEXT,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ürün özellikleri için tablo
CREATE TABLE IF NOT EXISTS product_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    property_name TEXT NOT NULL,
    property_value TEXT NOT NULL,
    language quotation_language DEFAULT 'TR',
    display_order INTEGER DEFAULT 0,
    conditional_display TEXT,
    show_in_quotation BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alt ürünler için tablo
CREATE TABLE IF NOT EXISTS product_sub_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sub_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_product_id, sub_product_id)
);

-- Ürünlere ek alanlar ekleyelim
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS hs_code TEXT,
ADD COLUMN IF NOT EXISTS warranty_period TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS technical_specs JSONB,
ADD COLUMN IF NOT EXISTS ignore_sub_item_pricing BOOLEAN DEFAULT false;

-- Teklif kalemleri tablosunu güncelleyelim
ALTER TABLE quotation_items 
ADD COLUMN IF NOT EXISTS selected_matrix_id UUID REFERENCES product_matrices(id),
ADD COLUMN IF NOT EXISTS custom_properties JSONB,
ADD COLUMN IF NOT EXISTS is_sub_item BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_item_id UUID REFERENCES quotation_items(id);

-- Firma ayarları için tablo
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_type TEXT NOT NULL,
    name TEXT NOT NULL,
    value JSONB NOT NULL,
    language quotation_language DEFAULT 'TR',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sorumluluklar için tablo
CREATE TABLE IF NOT EXISTS quotation_responsibilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    responsibility_type TEXT NOT NULL,
    responsible_party TEXT NOT NULL,
    description TEXT,
    language quotation_language DEFAULT 'TR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sözlük tablosu
CREATE TABLE IF NOT EXISTS dictionary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name TEXT NOT NULL,
    value TEXT NOT NULL,
    language quotation_language NOT NULL,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(key_name, language)
);

-- RLS politikaları
ALTER TABLE product_matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sub_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_responsibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE dictionary ENABLE ROW LEVEL SECURITY;

-- Basit RLS politikaları
CREATE POLICY "Allow all for authenticated users" ON product_matrices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON matrix_values FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON product_properties FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON product_sub_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON company_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON quotation_responsibilities FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON dictionary FOR ALL TO authenticated USING (true);
