
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, FileText, ShoppingCart, Calendar, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  // Dashboard istatistiklerini çek
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [companies, products, quotations, orders, exhibitions] = await Promise.all([
        supabase.from('companies').select('id', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('quotations').select('id', { count: 'exact' }),
        supabase.from('orders').select('id', { count: 'exact' }),
        supabase.from('exhibitions').select('id', { count: 'exact' })
      ]);

      // Aktif teklifler (draft veya sent durumunda)
      const { count: activeQuotations } = await supabase
        .from('quotations')
        .select('id', { count: 'exact' })
        .in('status', ['draft', 'sent']);

      // Bekleyen siparişler
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      return {
        companies: companies.count || 0,
        products: products.count || 0,
        quotations: quotations.count || 0,
        orders: orders.count || 0,
        exhibitions: exhibitions.count || 0,
        activeQuotations: activeQuotations || 0,
        pendingOrders: pendingOrders || 0,
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Toplam Firmalar',
      value: stats?.companies || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Toplam Ürünler',
      value: stats?.products || 0,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Aktif Teklifler',
      value: stats?.activeQuotations || 0,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Bekleyen Siparişler',
      value: stats?.pendingOrders || 0,
      icon: ShoppingCart,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Toplam Siparişler',
      value: stats?.orders || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Fuar/Ziyaretler',
      value: stats?.exhibitions || 0,
      icon: Calendar,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Hoş geldiniz, {user?.user_metadata?.first_name || user?.email}! 
          İşletmenizin genel durumunu buradan takip edebilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Son Aktiviteler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="text-sm">
                  <p className="font-medium">Sistem aktif</p>
                  <p className="text-gray-600">CRM sistemi çalışıyor</p>
                </div>
              </div>
              <div className="text-center text-gray-500 text-sm py-4">
                Henüz aktivite bulunmuyor
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Hızlı İşlemler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <p className="font-medium text-blue-900">Yeni Firma Ekle</p>
                <p className="text-sm text-blue-700">Müşteri veya partner firma ekleyin</p>
              </button>
              <button className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <p className="font-medium text-green-900">Yeni Teklif Oluştur</p>
                <p className="text-sm text-green-700">Müşteri için fiyat teklifi hazırlayın</p>
              </button>
              <button className="w-full p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                <p className="font-medium text-orange-900">Ürün Ekle</p>
                <p className="text-sm text-orange-700">Kataloğa yeni ürün ekleyin</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
