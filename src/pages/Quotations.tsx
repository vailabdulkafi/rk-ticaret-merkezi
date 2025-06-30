
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Edit, Trash2, Building2, Calendar, User, Globe } from 'lucide-react';
import { toast } from 'sonner';
import QuotationFormModal from '@/components/quotations/QuotationFormModal';

const Quotations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);

  const { data: quotations, isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          companies (
            name
          ),
          prepared_by_profile:profiles!prepared_by (
            first_name,
            last_name
          ),
          reviewed_by_profile:profiles!reviewed_by (
            first_name,
            last_name
          ),
          quotation_items (
            id,
            quantity,
            unit_price,
            total_price,
            products (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Teklif başarıyla silindi');
    },
    onError: (error) => {
      toast.error('Teklif silinirken hata oluştu: ' + error.message);
    },
  });

  const filteredQuotations = quotations?.filter(quotation =>
    quotation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.companies?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Taslak';
      case 'sent':
        return 'Gönderildi';
      case 'accepted':
        return 'Kabul Edildi';
      case 'rejected':
        return 'Reddedildi';
      default:
        return status;
    }
  };

  const getLanguageText = (language: string) => {
    switch (language) {
      case 'TR':
        return 'Türkçe';
      case 'EN':
        return 'İngilizce';
      case 'PL':
        return 'Lehçe';
      case 'FR':
        return 'Fransızca';
      case 'RU':
        return 'Rusça';
      case 'DE':
        return 'Almanca';
      case 'AR':
        return 'Arapça';
      default:
        return language;
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
    }).format(price);
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
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Teklifler</h1>
          <p className="text-gray-600">Gelişmiş teklif sistemi ile müşteri tekliflerinizi yönetin</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setShowFormModal(true)}
        >
          <Plus className="h-4 w-4" />
          Yeni Teklif
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Teklif ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredQuotations.length} teklif bulundu
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuotations.map((quotation) => (
          <Card key={quotation.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{quotation.title}</CardTitle>
                    <Badge className={`mt-1 ${getStatusColor(quotation.status)}`}>
                      {getStatusText(quotation.status)}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteMutation.mutate(quotation.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm font-medium text-gray-900">
                {quotation.quotation_number}
              </div>
              
              {quotation.companies && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {quotation.companies.name}
                </div>
              )}

              {quotation.quotation_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {formatDate(quotation.quotation_date)}
                </div>
              )}

              {quotation.language && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {getLanguageText(quotation.language)}
                </div>
              )}

              {quotation.prepared_by_profile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {quotation.prepared_by_profile.first_name} {quotation.prepared_by_profile.last_name}
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold text-gray-900">
                  {formatPrice(quotation.total_amount, quotation.currency)}
                </div>
                {quotation.revision_number && quotation.revision_number > 1 && (
                  <Badge variant="outline">
                    Rev. {quotation.revision_number}
                  </Badge>
                )}
              </div>

              {quotation.quotation_items && quotation.quotation_items.length > 0 && (
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Ürünler: </span>
                  {quotation.quotation_items.length} kalem
                </div>
              )}

              {quotation.valid_until && (
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Geçerlilik: </span>
                  {formatDate(quotation.valid_until)}
                </div>
              )}

              {quotation.notes && (
                <div className="text-sm text-gray-500 line-clamp-2">
                  {quotation.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredQuotations.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Teklif bulunamadı</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Arama kriterlerinize uygun teklif bulunamadı.' : 'Henüz teklif oluşturulmamış. Gelişmiş teklif sistemi ile profesyonel teklifler oluşturabilirsiniz.'}
          </p>
          <Button onClick={() => setShowFormModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            İlk teklifi oluştur
          </Button>
        </div>
      )}

      <QuotationFormModal 
        open={showFormModal}
        onOpenChange={setShowFormModal}
      />
    </div>
  );
};

export default Quotations;
