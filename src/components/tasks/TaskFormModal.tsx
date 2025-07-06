
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string;
  assigned_to: string;
}

export const TaskFormModal = ({ open, onOpenChange, task }: TaskFormModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    due_date: '',
    assigned_to: ''
  });

  // Kullanıcı listesini çek
  const { data: users } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('first_name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        due_date: task.due_date || '',
        assigned_to: task.assigned_to || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        due_date: '',
        assigned_to: user?.id || ''
      });
    }
  }, [task, open, user?.id]);

  const createMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı');
      
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          due_date: data.due_date || null,
          assigned_to: data.assigned_to || null,
          created_by: user.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Görev başarıyla oluşturuldu');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Görev oluşturulurken hata oluştu: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      if (!task?.id) throw new Error('Görev ID bulunamadı');
      
      const { error } = await supabase
        .from('tasks')
        .update({
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          due_date: data.due_date || null,
          assigned_to: data.assigned_to || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Görev başarıyla güncellendi');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Görev güncellenirken hata oluştu: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Görev başlığı zorunludur');
      return;
    }
    
    if (task) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const getUserDisplayName = (user: any) => {
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return name || user.email;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? 'Görev Güncelle' : 'Yeni Görev Oluştur'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Görev Başlığı *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Öncelik</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="low">Düşük</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Durum</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Yapılacak</SelectItem>
                  <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                  <SelectItem value="done">Tamamlandı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due_date">Bitiş Tarihi</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="assigned_to">Atanan Kişi</Label>
              <Select value={formData.assigned_to} onValueChange={(value) => handleInputChange('assigned_to', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kişi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Atanmamış</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {getUserDisplayName(user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (task ? 'Güncelleniyor...' : 'Oluşturuluyor...') : (task ? 'Görev Güncelle' : 'Görev Oluştur')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
