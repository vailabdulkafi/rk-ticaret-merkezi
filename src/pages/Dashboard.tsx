
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, FileText, ShoppingCart, Calendar, TrendingUp, Euro, BarChart3 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();

  // Dashboard istatistiklerini çek
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      // Temel sayılar
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

      // Bu ayın teklifleri
      const { data: monthlyQuotations } = await supabase
        .from('quotations')
        .select('total_amount, currency, created_at')
        .gte('created_at', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('created_at', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      // Bu yılın teklifleri
      const { data: yearlyQuotations } = await supabase
        .from('quotations')
        .select('total_amount, currency, created_at')
        .gte('created_at', `${currentYear}-01-01`)
        .lt('created_at', `${currentYear + 1}-01-01`);

      // Bu ayın siparişleri
      const { data: monthlyOrders } = await supabase
        .from('orders')
        .select('total_amount, currency, created_at')
        .gte('created_at', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('created_at', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      // Bu yılın siparişleri
      const { data: yearlyOrders } = await supabase
        .from('orders')
        .select('total_amount, currency, created_at')
        .gte('created_at', `${currentYear}-01-01`)
        .lt('created_at', `${currentYear + 1}-01-01`);

      // Para birimi dönüşüm fonksiyonu (basit örnek)
      const convertToEur = (amount: number, currency: string) => {
        const rates: { [key: string]: number } = {
          'TRY': 0.035, // 1 TRY = 0.035 EUR (örnek kur)
          'USD': 0.92,  // 1 USD = 0.92 EUR
          'EUR': 1      // 1 EUR = 1 EUR
        };
        return (amount * (rates[currency] || rates['TRY']));
      };

      // Aylık teklif istatistikleri
      const monthlyQuotationStats = {
        count: monthlyQuotations?.length || 0,
        totalAmountEur: monthlyQuotations?.reduce((sum, q) => 
          sum + convertToEur(q.total_amount || 0, q.currency), 0) || 0
      };

      // Yıllık teklif istatistikleri
      const yearlyQuotationStats = {
        count: yearlyQuotations?.length || 0,
        totalAmountEur: yearlyQuotations?.reduce((sum, q) => 
          sum + convertToEur(q.total_amount || 0, q.currency), 0) || 0
      };

      // Aylık sipariş istatistikleri
      const monthlyOrderStats = {
        count: monthlyOrders?.length || 0,
        totalAmountEur: monthlyOrders?.reduce((sum, o) => 
          sum + convertToEur(o.total_amount || 0, o.currency), 0) || 0
      };

      // Yıllık sipariş istatistikleri
      const yearlyOrderStats = {
        count: yearlyOrders?.length || 0,
        totalAmountEur: yearlyOrders?.reduce((sum, o) => 
          sum + convertToEur(o.total_amount || 0, o.currency), 0) || 0
      };

      return {
        companies: companies.count || 0,
        products: products.count || 0,
        quotations: quotations.count || 0,
        orders: orders.count || 0,
        exhibitions: exhibitions.count || 0,
        activeQuotations: activeQuotations || 0,
        pendingOrders: pendingOrders || 0,
        monthlyQuotations: monthlyQuotationStats,
        yearlyQuotations: yearlyQuotationStats,
        monthlyOrders: monthlyOrderStats,
        yearlyOrders: yearlyOrderStats,
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const primaryStats = [
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

  const monthlyYearlyStats = [
    {
      title: 'Bu Ay Teklif Adedi',
      value: stats?.monthlyQuotations.count || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Bu Ay Teklif Tutarı',
      value: formatCurrency(stats?.monthlyQuotations.totalAmountEur || 0),
      icon: Euro,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      isAmount: true,
    },
    {
      title: 'Bu Yıl Teklif Adedi',
      value: stats?.yearlyQuotations.count || 0,
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Bu Yıl Teklif Tutarı',
      value: formatCurrency(stats?.yearlyQuotations.totalAmountEur || 0),
      icon: Euro,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      isAmount: true,
    },
    {
      title: 'Bu Ay Sipariş Adedi',
      value: stats?.monthlyOrders.count || 0,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Bu Ay Sipariş Tutarı',
      value: formatCurrency(stats?.monthlyOrders.totalAmountEur || 0),
      icon: Euro,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      isAmount: true,
    },
    {
      title: 'Bu Yıl Sipariş Adedi',
      value: stats?.yearlyOrders.count || 0,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Bu Yıl Sipariş Tutarı',
      value: formatCurrency(stats?.yearlyOrders.totalAmountEur || 0),
      icon: Euro,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      isAmount: true,
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 text-sm md:text-base">
          Hoş geldiniz, {user?.user_metadata?.first_name || user?.email}! 
          İşletmenizin genel durumunu buradan takip edebilirsiniz.
        </p>
      </div>

      {/* Genel İstatistikler */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Genel Durum</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {primaryStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Aylık/Yıllık İstatistikler */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aylık & Yıllık Performans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {monthlyYearlyStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs md:text-sm font-medium text-gray-600 leading-tight">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-1.5 md:p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-lg md:text-2xl font-bold text-gray-900 ${stat.isAmount ? 'text-sm md:text-lg' : ''}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Alt Bölümler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <FileText className="h-4 w-4 md:h-5 md:w-5" />
              Son Aktiviteler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <div className="text-sm">
                  <p className="font-medium">Sistem aktif</p>
                  <p className="text-gray-600 text-xs">CRM sistemi çalışıyor</p>
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
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
              Hızlı İşlemler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <p className="font-medium text-blue-900 text-sm md:text-base">Yeni Firma Ekle</p>
                <p className="text-xs md:text-sm text-blue-700">Müşteri veya partner firma ekleyin</p>
              </button>
              <button className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <p className="font-medium text-green-900 text-sm md:text-base">Yeni Teklif Oluştur</p>
                <p className="text-xs md:text-sm text-green-700">Müşteri için fiyat teklifi hazırlayın</p>
              </button>
              <button className="w-full p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                <p className="font-medium text-orange-900 text-sm md:text-base">Ürün Ekle</p>
                <p className="text-xs md:text-sm text-orange-700">Kataloğa yeni ürün ekleyin</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
