
-- Firma bilgileri tablosu
CREATE TABLE IF NOT EXISTS company_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  tax_number TEXT,
  trade_registry_number TEXT,
  website TEXT,
  logo_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Banka bilgileri tablosu
CREATE TABLE IF NOT EXISTS bank_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  branch_name TEXT,
  account_number TEXT NOT NULL,
  iban TEXT,
  swift_code TEXT,
  account_holder TEXT,
  currency TEXT DEFAULT 'TRY',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ödeme şekilleri tablosu
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  language quotation_language DEFAULT 'TR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users
);

-- Teslim şekilleri tablosu
CREATE TABLE IF NOT EXISTS delivery_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  language quotation_language DEFAULT 'TR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users
);

-- Dil ayarları için mevcut dictionary tablosunu kullanacağız
-- Gerekirse yeni kayıtlar ekleyeceğiz

-- RLS politikaları
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_methods ENABLE ROW LEVEL SECURITY;

-- Company info policies
CREATE POLICY "Users can view company info" ON company_info FOR SELECT USING (true);
CREATE POLICY "Users can insert company info" ON company_info FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update company info" ON company_info FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete company info" ON company_info FOR DELETE USING (auth.uid() = created_by);

-- Bank info policies
CREATE POLICY "Users can view bank info" ON bank_info FOR SELECT USING (true);
CREATE POLICY "Users can insert bank info" ON bank_info FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update bank info" ON bank_info FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete bank info" ON bank_info FOR DELETE USING (auth.uid() = created_by);

-- Payment methods policies
CREATE POLICY "Users can view payment methods" ON payment_methods FOR SELECT USING (true);
CREATE POLICY "Users can insert payment methods" ON payment_methods FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update payment methods" ON payment_methods FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete payment methods" ON payment_methods FOR DELETE USING (auth.uid() = created_by);

-- Delivery methods policies
CREATE POLICY "Users can view delivery methods" ON delivery_methods FOR SELECT USING (true);
CREATE POLICY "Users can insert delivery methods" ON delivery_methods FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update delivery methods" ON delivery_methods FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete delivery methods" ON delivery_methods FOR DELETE USING (auth.uid() = created_by);
