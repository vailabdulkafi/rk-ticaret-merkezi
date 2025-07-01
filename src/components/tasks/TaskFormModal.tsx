
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onSuccess: () => void;
}

export function TaskFormModal({ isOpen, onClose, task, onSuccess }: TaskFormModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assigned_to: '',
    due_date: '',
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          user_id,
          profiles!employees_user_id_fkey(first_name, last_name)
        `)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        assigned_to: task.assigned_to || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        assigned_to: '',
        due_date: '',
      });
    }
  }, [task]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        created_by: user?.id,
        updated_at: new Date().toISOString(),
        assigned_to: data.assigned_to || null,
        due_date: data.due_date || null,
      };

      if (task) {
        const { error } = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(task ? 'Görev güncellendi' : 'Görev oluşturuldu');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error('Task save error:', error);
      toast.error('Görev kaydedilirken hata oluştu');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Görev başlığı gerekli');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Görevi Düzenle' : 'Yeni Görev'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Başlık *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Görev başlığı"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Görev açıklaması"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Öncelik</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Durum</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="todo">Yapılacak</SelectItem>
                  <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                  <SelectItem value="review">İnceleme</SelectItem>
                  <SelectItem value="done">Tamamlandı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="assigned_to">Atanan Kişi</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kişi seç" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="">Atanmamış</SelectItem>
                {employees?.map((employee) => (
                  <SelectItem key={employee.user_id} value={employee.user_id}>
                    {employee.profiles?.first_name} {employee.profiles?.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="due_date">Bitiş Tarihi</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Kaydediliyor...' : (task ? 'Güncelle' : 'Oluştur')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
