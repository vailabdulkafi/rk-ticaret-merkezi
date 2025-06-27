
-- Create user profiles table for role management
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'manager', 'sales')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create companies table (müşteri ve partner firmalar)
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('customer', 'partner')),
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  tax_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product categories table
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table (ürün yönetimi)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.product_categories,
  description TEXT,
  unit_price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  stock_quantity INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'adet',
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotations table (teklif sistemi)
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_number TEXT NOT NULL UNIQUE,
  company_id UUID REFERENCES public.companies NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'TRY',
  valid_until DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotation items table
CREATE TABLE public.quotation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID REFERENCES public.quotations ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table (sipariş takibi)
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  quotation_id UUID REFERENCES public.quotations,
  company_id UUID REFERENCES public.companies NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'production', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'TRY',
  delivery_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exhibitions table (fuar ve ziyaret takibi)
CREATE TABLE public.exhibitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('exhibition', 'visit', 'meeting')),
  location TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exhibition follow-ups table
CREATE TABLE public.exhibition_followups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID REFERENCES public.exhibitions ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies,
  contact_person TEXT,
  follow_up_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibition_followups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for companies (all authenticated users can access)
CREATE POLICY "Authenticated users can view companies" ON public.companies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert companies" ON public.companies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update companies" ON public.companies FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete companies" ON public.companies FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for product categories (all authenticated users can access)
CREATE POLICY "Authenticated users can view categories" ON public.product_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert categories" ON public.product_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update categories" ON public.product_categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete categories" ON public.product_categories FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for products (all authenticated users can access)
CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete products" ON public.products FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for quotations (all authenticated users can access)
CREATE POLICY "Authenticated users can view quotations" ON public.quotations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert quotations" ON public.quotations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update quotations" ON public.quotations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete quotations" ON public.quotations FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for quotation items (all authenticated users can access)
CREATE POLICY "Authenticated users can view quotation items" ON public.quotation_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert quotation items" ON public.quotation_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update quotation items" ON public.quotation_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete quotation items" ON public.quotation_items FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for orders (all authenticated users can access)
CREATE POLICY "Authenticated users can view orders" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert orders" ON public.orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update orders" ON public.orders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete orders" ON public.orders FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for order items (all authenticated users can access)
CREATE POLICY "Authenticated users can view order items" ON public.order_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert order items" ON public.order_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update order items" ON public.order_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete order items" ON public.order_items FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for exhibitions (all authenticated users can access)
CREATE POLICY "Authenticated users can view exhibitions" ON public.exhibitions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert exhibitions" ON public.exhibitions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update exhibitions" ON public.exhibitions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete exhibitions" ON public.exhibitions FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for exhibition followups (all authenticated users can access)
CREATE POLICY "Authenticated users can view exhibition followups" ON public.exhibition_followups FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert exhibition followups" ON public.exhibition_followups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update exhibition followups" ON public.exhibition_followups FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete exhibition followups" ON public.exhibition_followups FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some default product categories
INSERT INTO public.product_categories (name, description) VALUES 
('Genel', 'Genel ürün kategorisi'),
('Elektrik', 'Elektrik malzemeleri'),
('Makina', 'Makina parçaları'),
('Kimyasal', 'Kimyasal ürünler');
