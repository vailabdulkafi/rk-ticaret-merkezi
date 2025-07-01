
-- Tasks tablosunu oluştur
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Row Level Security (RLS) politikalarını etkinleştir
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi oluşturdukları veya kendilerine atanan görevleri görebilir
CREATE POLICY "Users can view relevant tasks" 
  ON public.tasks 
  FOR SELECT 
  USING (
    auth.uid() = created_by 
    OR auth.uid() = assigned_to
  );

-- Kullanıcılar görev oluşturabilir
CREATE POLICY "Users can create tasks" 
  ON public.tasks 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Kullanıcılar kendi oluşturdukları veya kendilerine atanan görevleri güncelleyebilir
CREATE POLICY "Users can update relevant tasks" 
  ON public.tasks 
  FOR UPDATE 
  USING (
    auth.uid() = created_by 
    OR auth.uid() = assigned_to
  );

-- Kullanıcılar sadece kendi oluşturdukları görevleri silebilir
CREATE POLICY "Users can delete own tasks" 
  ON public.tasks 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Status için check constraint ekle
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('todo', 'in_progress', 'review', 'done'));

-- Priority için check constraint ekle
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_priority_check 
CHECK (priority IN ('low', 'medium', 'high'));
