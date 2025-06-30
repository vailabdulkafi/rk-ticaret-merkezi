
-- Roller için enum oluştur
CREATE TYPE public.employee_role AS ENUM ('employee', 'specialist', 'manager', 'director');

-- Çalışanlar tablosu oluştur
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_number TEXT UNIQUE,
  department TEXT,
  position TEXT,
  hire_date DATE,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Çalışan rolleri tablosu oluştur
CREATE TABLE public.employee_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  role employee_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(employee_id, role)
);

-- Çalışan hiyerarşisi tablosu (kim kimin altında çalışıyor)
CREATE TABLE public.employee_hierarchy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(employee_id, manager_id)
);

-- RLS politikaları
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_hierarchy ENABLE ROW LEVEL SECURITY;

-- Yetki kontrol fonksiyonu
CREATE OR REPLACE FUNCTION public.has_employee_role(_user_id uuid, _role employee_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    JOIN public.employee_roles er ON e.id = er.employee_id
    WHERE e.user_id = _user_id
      AND er.role = _role
      AND er.is_active = true
      AND e.is_active = true
  )
$$;

-- Müdür veya kendisi mi kontrol fonksiyonu
CREATE OR REPLACE FUNCTION public.can_manage_employee(_user_id uuid, _target_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (
    -- Kendisi ise
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE user_id = _user_id AND id = _target_employee_id
    )
    OR
    -- Müdürü ise
    EXISTS (
      SELECT 1
      FROM public.employees e1
      JOIN public.employee_hierarchy eh ON e1.id = eh.manager_id
      JOIN public.employees e2 ON eh.employee_id = e2.id
      WHERE e1.user_id = _user_id AND e2.id = _target_employee_id
    )
    OR
    -- Yönetici rolü varsa
    public.has_employee_role(_user_id, 'manager')
    OR
    -- Direktör rolü varsa
    public.has_employee_role(_user_id, 'director')
  )
$$;

-- RLS Politikaları
-- Çalışanlar tablosu politikaları
CREATE POLICY "Herkes çalışanları görüntüleyebilir"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sadece yetkili kişiler çalışan ekleyebilir"
  ON public.employees FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_employee_role(auth.uid(), 'manager') OR
    public.has_employee_role(auth.uid(), 'director')
  );

CREATE POLICY "Sadece yetkili kişiler çalışan güncelleyebilir"
  ON public.employees FOR UPDATE
  TO authenticated
  USING (
    public.can_manage_employee(auth.uid(), id)
  );

-- Çalışan rolleri tablosu politikaları
CREATE POLICY "Herkes rolleri görüntüleyebilir"
  ON public.employee_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sadece yöneticiler rol atayabilir"
  ON public.employee_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_employee_role(auth.uid(), 'manager') OR
    public.has_employee_role(auth.uid(), 'director')
  );

CREATE POLICY "Sadece yöneticiler rol güncelleyebilir"
  ON public.employee_roles FOR UPDATE
  TO authenticated
  USING (
    public.has_employee_role(auth.uid(), 'manager') OR
    public.has_employee_role(auth.uid(), 'director')
  );

-- Hiyerarşi tablosu politikaları
CREATE POLICY "Herkes hiyerarşiyi görüntüleyebilir"
  ON public.employee_hierarchy FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sadece yöneticiler hiyerarşi oluşturabilir"
  ON public.employee_hierarchy FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_employee_role(auth.uid(), 'manager') OR
    public.has_employee_role(auth.uid(), 'director')
  );
