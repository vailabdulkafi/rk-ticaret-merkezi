import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, FileText, Edit, Trash2, Building2, RefreshCw, ShoppingCart, Download, Package2 } from 'lucide-react';
import { toast } from 'sonner';
import QuotationFormModal from '@/components/quotations/QuotationFormModal';
import QuotationItemsModal from '@/components/quotations/QuotationItemsModal';
import { generateQuotationPdf } from '@/components/quotations/QuotationPdfGenerator';

const Quotations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<any>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);

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

  const convertToOrderMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      const quotation = quotations?.find(q => q.id === quotationId);
      if (!quotation) throw new Error('Teklif bulunamadı');

      const orderNumber = `SIP-${Date.now()}`;
      const { error } = await supabase
        .from('orders')
        .insert({
          title: quotation.title,
          order_number: orderNumber,
          company_id: quotation.company_id,
          total_amount: quotation.total_amount,
          currency: quotation.currency,
          quotation_id: quotationId,
          created_by: user?.id || '',
          status: 'pending'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Teklif siparişe dönüştürüldü');
    },
    onError: (error) => {
      toast.error('Sipariş oluşturulurken hata oluştu: ' + error.message);
    },
  });

  const createRevisionMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      const quotation = quotations?.find(q => q.id === quotationId);
      if (!quotation) throw new Error('Teklif bulunamadı');

      const newQuotationNumber = `${quotation.quotation_number}-R${(quotation.revision_number || 1) + 1}`;
      const { error } = await supabase
        .from('quotations')
        .insert({
          title: quotation.title + ' (Revizyon)',
          quotation_number: newQuotationNumber,
          company_id: quotation.company_id,
          total_amount: quotation.total_amount,
          currency: quotation.currency,
          parent_quotation_id: quotationId,
          revision_number: (quotation.revision_number || 1) + 1,
          prepared_by: quotation.prepared_by,
          language: quotation.language,
          created_by: user?.id || '',
          status: 'draft'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Teklif revizyonu oluşturuldu');
    },
    onError: (error) => {
      toast.error('Revizyon oluşturulurken hata oluştu: ' + error.message);
    },
  });

  const handleEditClick = (quotation: any) => {
    setEditingQuotation(quotation);
    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setEditingQuotation(null);
  };

  const handleItemsClick = (quotation: any) => {
    setSelectedQuotation(quotation);
    setShowItemsModal(true);
  };

  const handlePdfDownload = async (quotation: any) => {
    try {
      // Teklif ürünlerini ve firma bilgilerini çek
      const { data: items } = await supabase
        .from('quotation_items')
        .select(`
          *,
          products (
            name,
            brand,
            model,
            product_properties (
              property_name,
              property_value,
              show_in_quotation
            )
          )
        `)
        .eq('quotation_id', quotation.id);

      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', quotation.company_id)
        .single();

      await generateQuotationPdf({
        quotation,
        items: items || [],
        company
      });

      toast.success('PDF başarıyla oluşturuldu');
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast.error('PDF oluşturulurken hata oluştu');
    }
  };

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
          <div className="h-48 bg-gray-200 rounded"></div>
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teklif No</TableHead>
                <TableHead>Başlık</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Rev.</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      {quotation.quotation_number}
                    </div>
                  </TableCell>
                  <TableCell>{quotation.title}</TableCell>
                  <TableCell>
                    {quotation.companies ? (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {quotation.companies.name}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(quotation.status)}>
                      {getStatusText(quotation.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(quotation.total_amount, quotation.currency)}
                  </TableCell>
                  <TableCell>
                    {quotation.quotation_date && formatDate(quotation.quotation_date)}
                  </TableCell>
                  <TableCell>
                    {quotation.revision_number && quotation.revision_number > 1 && (
                      <Badge variant="outline">
                        Rev. {quotation.revision_number}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleItemsClick(quotation)}
                        title="Ürünler"
                      >
                        <Package2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => createRevisionMutation.mutate(quotation.id)}
                        disabled={createRevisionMutation.isPending}
                        title="Revize Et"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => convertToOrderMutation.mutate(quotation.id)}
                        disabled={convertToOrderMutation.isPending}
                        title="Siparişe Dönüştür"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handlePdfDownload(quotation)}
                        title="PDF İndir"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditClick(quotation)}
                      >
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredQuotations.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Teklif bulunamadı</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Arama kriterlerinize uygun teklif bulunamadı.' : 'Henüz teklif oluşturulmamış.'}
          </p>
          <Button onClick={() => setShowFormModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            İlk teklifi oluştur
          </Button>
        </div>
      )}

      <QuotationFormModal 
        open={showFormModal}
        onOpenChange={handleCloseModal}
        quotation={editingQuotation}
      />

      <QuotationItemsModal 
        open={showItemsModal}
        onOpenChange={setShowItemsModal}
        quotation={selectedQuotation}
      />
    </div>
  );
};

export default Quotations;
