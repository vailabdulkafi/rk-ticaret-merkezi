
-- Add properties table for products with multi-language support
CREATE TABLE IF NOT EXISTS public.product_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  property_value TEXT NOT NULL,
  language quotation_language DEFAULT 'TR',
  display_order INTEGER DEFAULT 0,
  show_in_quotation BOOLEAN DEFAULT true,
  conditional_display TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add exhibition costs table for multiple cost entries per exhibition
CREATE TABLE IF NOT EXISTS public.exhibition_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'TRY',
  cost_date DATE DEFAULT CURRENT_DATE,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Add quotation settings table to store selected company info, bank, payment method etc. for each quotation
CREATE TABLE IF NOT EXISTS public.quotation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  company_info_id UUID REFERENCES public.company_info(id),
  bank_info_id UUID REFERENCES public.bank_info(id),
  payment_method_id UUID REFERENCES public.payment_methods(id),
  delivery_method_id UUID REFERENCES public.delivery_methods(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add quotation responsibilities table
CREATE TABLE IF NOT EXISTS public.quotation_responsibilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  responsibility_type TEXT NOT NULL, -- 'customer' or 'supplier'
  responsible_party TEXT NOT NULL,
  description TEXT,
  language quotation_language DEFAULT 'TR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update company_settings table to fix theme settings unique constraint issue
DROP INDEX IF EXISTS idx_company_settings_unique;
CREATE UNIQUE INDEX idx_company_settings_unique ON public.company_settings (setting_type, name, language);

-- Add orders conversion tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quotation_id UUID REFERENCES public.quotations(id);

-- Add revision tracking for quotations
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS parent_quotation_id UUID REFERENCES public.quotations(id);
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 1;
