
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Calendar, Edit, Trash2, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

const Exhibitions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

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
      toast.success('Etkinlik başarıyla silindi');
    },
    onError: (error) => {
      toast.error('Etkinlik silinirken hata oluştu: ' + error.message);
    },
  });

  const filteredExhibitions = exhibitions?.filter(exhibition =>
    exhibition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exhibition.location?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    const colors = {
      planned: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.planned;
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      planned: 'Planlandı',
      ongoing: 'Devam Ediyor',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      exhibition: 'bg-purple-100 text-purple-800',
      visit: 'bg-cyan-100 text-cyan-800',
      meeting: 'bg-orange-100 text-orange-800',
    };
    return colors[type as keyof typeof colors] || colors.exhibition;
  };

  const getTypeText = (type: string) => {
    const typeMap = {
      exhibition: 'Fuar',
      visit: 'Ziyaret',
      meeting: 'Toplantı',
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fuarlar ve Ziyaretler</h1>
          <p className="text-gray-600">Etkinliklerinizi ve ziyaretlerinizi planlayın</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Yeni Etkinlik
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Etkinlik ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredExhibitions.length} etkinlik bulundu
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExhibitions.map((exhibition) => (
          <Card key={exhibition.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{exhibition.name}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge className={getTypeColor(exhibition.type)}>
                        {getTypeText(exhibition.type)}
                      </Badge>
                      <Badge className={getStatusColor(exhibition.status)}>
                        {getStatusText(exhibition.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
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
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {exhibition.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {exhibition.location}
                </div>
              )}

              {(exhibition.start_date || exhibition.end_date) && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>
                    {exhibition.start_date && formatDate(exhibition.start_date)}
                    {exhibition.start_date && exhibition.end_date && ' - '}
                    {exhibition.end_date && exhibition.end_date !== exhibition.start_date && formatDate(exhibition.end_date)}
                  </span>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Oluşturulma: {formatDate(exhibition.created_at)}
              </div>

              {exhibition.notes && (
                <div className="text-sm text-gray-500 line-clamp-3">
                  {exhibition.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredExhibitions.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Etkinlik bulunamadı</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Arama kriterlerinize uygun etkinlik bulunamadı.' : 'Henüz etkinlik eklenmemiş.'}
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            İlk etkinliği ekle
          </Button>
        </div>
      )}
    </div>
  );
};

export default Exhibitions;
