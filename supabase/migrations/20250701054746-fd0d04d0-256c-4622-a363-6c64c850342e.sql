
-- Önce mevcut foreign key constraint'lerini kontrol et ve temizle
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_user_id_fkey;

-- Doğru foreign key constraint'ini ekle
ALTER TABLE public.employees 
ADD CONSTRAINT employees_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- employees tablosundaki user_id sütununun null olmamasını sağla
ALTER TABLE public.employees ALTER COLUMN user_id SET NOT NULL;
