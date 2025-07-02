
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Clock, ChevronDown, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  assigned_user?: {
    first_name: string | null;
    last_name: string | null;
  };
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return 'Belirsiz';
    }
  };

  const statuses = [
    { key: 'todo', label: 'Yapılacak' },
    { key: 'in_progress', label: 'Devam Ediyor' },
    { key: 'done', label: 'Tamamlandı' }
  ];

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle 
            className="text-sm font-medium cursor-pointer hover:text-blue-600"
            onClick={() => onEdit(task)}
          >
            {task.title}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)}>
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white">
                {statuses.map((status) => (
                  <DropdownMenuItem
                    key={status.key}
                    onClick={() => onStatusChange(task.id, status.key)}
                    className="cursor-pointer"
                  >
                    {status.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {task.description && (
          <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant={getPriorityColor(task.priority)} className="text-xs">
              {getPriorityLabel(task.priority)}
            </Badge>
          </div>
          
          {task.assigned_user && (
            <div className="flex items-center text-xs text-gray-500">
              <User className="mr-1 h-3 w-3" />
              <span>{task.assigned_user.first_name} {task.assigned_user.last_name}</span>
            </div>
          )}
          
          {task.due_date && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="mr-1 h-3 w-3" />
              <span>{new Date(task.due_date).toLocaleDateString('tr-TR')}</span>
            </div>
          )}
          
          <div className="flex items-center text-xs text-gray-400">
            <Clock className="mr-1 h-3 w-3" />
            <span>{new Date(task.created_at).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
