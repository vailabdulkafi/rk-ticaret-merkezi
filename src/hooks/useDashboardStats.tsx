
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardStats = (user: any) => {
  return useQuery({
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
};
