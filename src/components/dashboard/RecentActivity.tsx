
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, FileText, Building2, Package, CreditCard, Truck, Settings, Calendar, CheckSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const RecentActivity = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const getActivityIcon = (tableName: string, action: string) => {
    switch (tableName) {
      case 'quotations': return <FileText className="h-4 w-4" />;
      case 'companies': return <Building2 className="h-4 w-4" />;
      case 'products': return <Package className="h-4 w-4" />;
      case 'orders': return <CreditCard className="h-4 w-4" />;
      case 'exhibitions': return <Calendar className="h-4 w-4" />;
      case 'tasks': return <CheckSquare className="h-4 w-4" />;
      case 'delivery_methods':
      case 'payment_methods': return <Truck className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionText = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert': return 'Eklendi';
      case 'update': return 'Güncellendi';
      case 'delete': return 'Silindi';
      default: return action;
    }
  };

  const getTableText = (tableName: string) => {
    switch (tableName) {
      case 'quotations': return 'Teklif';
      case 'companies': return 'Firma';
      case 'products': return 'Ürün';
      case 'orders': return 'Sipariş';
      case 'exhibitions': return 'Fuar';
      case 'tasks': return 'Görev';
      case 'delivery_methods': return 'Teslim Şekli';
      case 'payment_methods': return 'Ödeme Şekli';
      case 'company_info': return 'Firma Bilgisi';
      case 'bank_info': return 'Banka Bilgisi';
      default: return tableName;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Son Aktiviteler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Son Aktiviteler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities && activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  {getActivityIcon(activity.table_name, activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={getActivityColor(activity.action)}>
                      {getActionText(activity.action)}
                    </Badge>
                    <span className="text-sm font-medium text-gray-900">
                      {getTableText(activity.table_name)}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span>
                      {activity.profiles ? 
                        `${activity.profiles.first_name || ''} ${activity.profiles.last_name || ''}`.trim() || 'Bilinmeyen Kullanıcı'
                        : 'Bilinmeyen Kullanıcı'
                      }
                    </span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(activity.created_at), { 
                        addSuffix: true, 
                        locale: tr 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Henüz aktivite bulunmuyor</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
