
import { Users, Package, FileText, ShoppingCart, Calendar, TrendingUp, Euro, BarChart3 } from 'lucide-react';
import StatsCard from './StatsCard';

interface DashboardStatsProps {
  stats: any;
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
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
    <>
      {/* Genel İstatistikler */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Genel Durum</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {primaryStats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>
      </div>

      {/* Aylık/Yıllık İstatistikler */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aylık & Yıllık Performans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {monthlyYearlyStats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>
      </div>
    </>
  );
};

export default DashboardStats;
