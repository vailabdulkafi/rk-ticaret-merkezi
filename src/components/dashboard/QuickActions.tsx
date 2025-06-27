
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const QuickActions = () => {
  return (
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
  );
};

export default QuickActions;
