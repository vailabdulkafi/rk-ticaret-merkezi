
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, User, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { TaskCard } from '@/components/tasks/TaskCard';
import { toast } from 'sonner';

const Tasks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to:profiles!tasks_assigned_to_fkey(first_name, last_name),
          created_by_profile:profiles!tasks_created_by_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
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
    onError: () => {
      toast.error('Görev güncellenirken hata oluştu');
    }
  });

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setIsCreateModalOpen(true);
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTaskMutation.mutate({ id: taskId, status: newStatus });
  };

  const getTasksByStatus = (status: string) => {
    return tasks?.filter(task => task.status === status) || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'secondary';
      case 'in_progress': return 'default';
      case 'review': return 'outline';
      case 'done': return 'destructive';
      default: return 'secondary';
    }
  };

  const statuses = [
    { key: 'todo', label: 'Yapılacak', color: 'bg-gray-100' },
    { key: 'in_progress', label: 'Devam Ediyor', color: 'bg-blue-100' },
    { key: 'review', label: 'İnceleme', color: 'bg-yellow-100' },
    { key: 'done', label: 'Tamamlandı', color: 'bg-green-100' }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Görevler</h1>
          <p className="text-gray-600">Kanban tahtasında görevlerinizi yönetin</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Görev
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statuses.map((status) => {
          const statusTasks = getTasksByStatus(status.key);
          return (
            <div key={status.key} className="space-y-4">
              <Card className={`${status.color} border-2`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    {status.label}
                    <Badge variant={getStatusColor(status.key)}>
                      {statusTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>

              <div className="space-y-3">
                {statusTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onTaskClick={() => handleTaskClick(task)}
                    onStatusChange={handleStatusChange}
                    statuses={statuses}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <TaskFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
      />
    </div>
  );
};

export default Tasks;
