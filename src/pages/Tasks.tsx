
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import TaskCard from '@/components/tasks/TaskCard';
import TaskFormModal from '@/components/tasks/TaskFormModal';

const Tasks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      console.log('Görevler yükleniyor...');
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:assigned_to(first_name, last_name, email),
          created_user:created_by(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Görev yükleme hatası:', error);
        throw error;
      }
      console.log('Yüklenen görevler:', data);
      return data;
    },
    enabled: !!user,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      console.log('Görev durumu güncelleniyor:', id, status);
      const { error } = await supabase
        .from('tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Görev durumu güncellendi');
    },
    onError: (error) => {
      console.error('Görev güncelleme hatası:', error);
      toast.error('Görev güncellenirken hata oluştu: ' + error.message);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Görev siliniyor:', id);
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Görev başarıyla silindi');
    },
    onError: (error) => {
      console.error('Görev silme hatası:', error);
      toast.error('Görev silinirken hata oluştu: ' + error.message);
    },
  });

  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  }) || [];

  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
    done: filteredTasks.filter(task => task.status === 'done')
  };

  const handleAddTask = () => {
    console.log('Yeni görev ekleme modalı açılıyor');
    setSelectedTask(null);
    setShowFormModal(true);
  };

  const handleEditTask = (task: any) => {
    console.log('Görev düzenleme modalı açılıyor:', task);
    setSelectedTask(task);
    setShowFormModal(true);
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    console.log('Görev durumu değiştiriliyor:', taskId, newStatus);
    updateTaskMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleDeleteTask = (taskId: string) => {
    console.log('Görev silme onayı:', taskId);
    if (window.confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  if (error) {
    console.error('Görevler yüklenirken hata:', error);
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <p>Görevler yüklenirken hata oluştu: {error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Görevler</h1>
          <p className="text-gray-600">Görevlerinizi organize edin ve takip edin</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={handleAddTask}
        >
          <Plus className="h-4 w-4" />
          Yeni Görev
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Görev ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="todo">Yapılacak</SelectItem>
            <SelectItem value="in_progress">Devam Ediyor</SelectItem>
            <SelectItem value="done">Tamamlandı</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Öncelik" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Öncelikler</SelectItem>
            <SelectItem value="high">Yüksek</SelectItem>
            <SelectItem value="medium">Orta</SelectItem>
            <SelectItem value="low">Düşük</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              YAPILACAK
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                {tasksByStatus.todo.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByStatus.todo.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            ))}
            {tasksByStatus.todo.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">Yapılacak görev yok</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              DEVAM EDİYOR
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {tasksByStatus.in_progress.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByStatus.in_progress.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            ))}
            {tasksByStatus.in_progress.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">Devam eden görev yok</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              TAMAMLANDI
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {tasksByStatus.done.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByStatus.done.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            ))}
            {tasksByStatus.done.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">Tamamlanan görev yok</p>
            )}
          </CardContent>
        </Card>
      </div>

      <TaskFormModal 
        open={showFormModal}
        onOpenChange={setShowFormModal}
        task={selectedTask}
      />
    </div>
  );
};

export default Tasks;
