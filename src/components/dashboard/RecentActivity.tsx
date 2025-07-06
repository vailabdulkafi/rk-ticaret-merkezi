
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, User, Clock, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const RecentActivity = () => {
  const { user } = useAuth();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          profiles!activity_logs_user_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert':
        return <FileText className="h-3 w-3 text-green-500" />;
      case 'update':
        return <Activity className="h-3 w-3 text-blue-500" />;
      case 'delete':
        return <FileText className="h-3 w-3 text-red-500" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert':
        return 'bg-green-50 border-green-200';
      case 'update':
        return 'bg-blue-50 border-blue-200';
      case 'delete':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTableName = (tableName: string) => {
    const tableNames: { [key: string]: string } = {
      'companies': 'Firma',
      'products': 'Ürün',
      'quotations': 'Teklif',
      'orders': 'Sipariş',
      'tasks': 'Görev',
      'exhibitions': 'Fuar',
      'employees': 'Çalışan'
    };
    return tableNames[tableName] || tableName;
  };

  const formatAction = (action: string) => {
    const actions: { [key: string]: string } = {
      'create': 'oluşturuldu',
      'insert': 'eklendi',
      'update': 'güncellendi',
      'delete': 'silindi'
    };
    return actions[action.toLowerCase()] || action;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <FileText className="h-4 w-4 md:h-5 md:w-5" />
            Son Aktiviteler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <FileText className="h-4 w-4 md:h-5 md:w-5" />
          Son Aktiviteler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities && activities.length > 0 ? (
            activities.map((activity) => (
              <div 
                key={activity.id} 
                className={`flex items-center gap-3 p-3 rounded-lg border ${getActionColor(activity.action)}`}
              >
                <div className="flex-shrink-0">
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">
                    {formatTableName(activity.table_name)} {formatAction(activity.action)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <User className="h-3 w-3" />
                    <span>
                      {activity.profiles ? 
                        `${activity.profiles.first_name || ''} ${activity.profiles.last_name || ''}`.trim() || 'Bilinmeyen kullanıcı'
                        : 'Sistem'
                      }
                    </span>
                    <Clock className="h-3 w-3 ml-2" />
                    <span>
                      {new Date(activity.created_at).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 text-sm py-4">
              Henüz aktivite bulunmuyor
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
