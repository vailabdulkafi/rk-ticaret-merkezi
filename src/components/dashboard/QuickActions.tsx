
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Plus, Building, FileText, Package, ShoppingCart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Yeni Firma Ekle',
      description: 'Müşteri veya partner firma ekleyin',
      icon: Building,
      onClick: () => navigate('/companies'),
      color: 'blue'
    },
    {
      title: 'Yeni Teklif Oluştur',
      description: 'Müşteri için fiyat teklifi hazırlayın',
      icon: FileText,
      onClick: () => navigate('/quotations'),
      color: 'green'
    },
    {
      title: 'Ürün Ekle',
      description: 'Kataloğa yeni ürün ekleyin',
      icon: Package,
      onClick: () => navigate('/products'),
      color: 'orange'
    },
    {
      title: 'Sipariş Ekle',
      description: 'Yeni sipariş oluşturun',
      icon: ShoppingCart,
      onClick: () => navigate('/orders'),
      color: 'purple'
    },
    {
      title: 'Fuar Ekle',
      description: 'Yeni fuar planlaması yapın',
      icon: Calendar,
      onClick: () => navigate('/exhibitions'),
      color: 'indigo'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200';
      case 'green':
        return 'bg-green-50 hover:bg-green-100 text-green-900 border-green-200';
      case 'orange':
        return 'bg-orange-50 hover:bg-orange-100 text-orange-900 border-orange-200';
      case 'purple':
        return 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200';
      case 'indigo':
        return 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200';
      default:
        return 'bg-gray-50 hover:bg-gray-100 text-gray-900 border-gray-200';
    }
  };

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
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`w-full p-4 h-auto justify-start border ${getColorClasses(action.color)} transition-colors`}
              onClick={action.onClick}
            >
              <div className="flex items-center gap-3 w-full">
                <action.icon className="h-5 w-5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-sm md:text-base">{action.title}</p>
                  <p className="text-xs md:text-sm opacity-75">{action.description}</p>
                </div>
                <Plus className="h-4 w-4 ml-auto flex-shrink-0" />
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
