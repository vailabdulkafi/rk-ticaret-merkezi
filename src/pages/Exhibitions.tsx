
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Calendar, Edit, Trash2, MapPin, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import ExhibitionFormModal from '@/components/exhibitions/ExhibitionFormModal';
import ExhibitionCostModal from '@/components/exhibitions/ExhibitionCostModal';

const Exhibitions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [selectedExhibition, setSelectedExhibition] = useState<any>(null);

  const { data: exhibitions, isLoading } = useQuery({
    queryKey: ['exhibitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exhibitions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exhibitions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
      toast.success('Fuar başarıyla silindi');
    },
    onError: (error) => {
      toast.error('Fuar silinirken hata oluştu: ' + error.message);
    },
  });

  const filteredExhibitions = exhibitions?.filter(exhibition =>
    exhibition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exhibition.location?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned':
        return 'Planlanan';
      case 'active':
        return 'Aktif';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'trade_show':
        return 'Ticaret Fuarı';
      case 'exhibition':
        return 'Sergi';
      case 'conference':
        return 'Konferans';
      case 'seminar':
        return 'Seminer';
      default:
        return type;
    }
  };

  const handleCostClick = (exhibition: any) => {
    setSelectedExhibition(exhibition);
    setShowCostModal(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuarlar</h1>
          <p className="text-gray-600">Katıldığınız fuarları yönetin</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setShowFormModal(true)}
        >
          <Plus className="h-4 w-4" />
          Yeni Fuar
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Fuar ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredExhibitions.length} fuar bulundu
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fuar Adı</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Konum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Hedef Maliyet</TableHead>
                <TableHead>Gerçekleşen</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExhibitions.map((exhibition) => (
                <TableRow key={exhibition.id}>
                  <TableCell className="font-medium">{exhibition.name}</TableCell>
                  <TableCell>{getTypeText(exhibition.type)}</TableCell>
                  <TableCell>
                    {exhibition.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {exhibition.location}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {exhibition.start_date && (
                      <div className="text-sm">
                        {new Date(exhibition.start_date).toLocaleDateString('tr-TR')}
                        {exhibition.end_date && (
                          <span> - {new Date(exhibition.end_date).toLocaleDateString('tr-TR')}</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(exhibition.status)}>
                      {getStatusText(exhibition.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {exhibition.target_cost > 0 && (
                      <span className="text-sm">
                        {exhibition.target_cost} {exhibition.cost_currency}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {exhibition.actual_cost > 0 && (
                      <span className="text-sm">
                        {exhibition.actual_cost} {exhibition.cost_currency}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCostClick(exhibition)}
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteMutation.mutate(exhibition.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredExhibitions.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Fuar bulunamadı</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Arama kriterlerinize uygun fuar bulunamadı.' : 'Henüz fuar eklenmemiş.'}
          </p>
          <Button onClick={() => setShowFormModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            İlk fuarı ekle
          </Button>
        </div>
      )}

      <ExhibitionFormModal 
        open={showFormModal}
        onOpenChange={setShowFormModal}
      />
      
      <ExhibitionCostModal
        open={showCostModal}
        onOpenChange={setShowCostModal}
        exhibition={selectedExhibition}
      />
    </div>
  );
};

export default Exhibitions;
