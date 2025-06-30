
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import CompanyFormModal from '@/components/companies/CompanyFormModal';

const Companies = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
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
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Firma başarıyla silindi');
    },
    onError: (error) => {
      toast.error('Firma silinirken hata oluştu: ' + error.message);
    },
  });

  const filteredCompanies = companies?.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.city?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEditClick = (company: any) => {
    setEditingCompany(company);
    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setEditingCompany(null);
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'customer':
        return 'Müşteri';
      case 'supplier':
        return 'Tedarikçi';
      case 'both':
        return 'Müşteri & Tedarikçi';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'customer':
        return 'bg-blue-100 text-blue-800';
      case 'supplier':
        return 'bg-green-100 text-green-800';
      case 'both':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Firmalar</h1>
          <p className="text-gray-600">Müşteri ve tedarikçi firmalarını yönetin</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setShowFormModal(true)}
        >
          <Plus className="h-4 w-4" />
          Yeni Firma
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Firma ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredCompanies.length} firma bulundu
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma Adı</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>İletişim Kişisi</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Şehir</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      {company.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(company.type)}>
                      {getTypeText(company.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{company.contact_person || '-'}</TableCell>
                  <TableCell>
                    {company.email ? (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {company.email}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {company.phone ? (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {company.phone}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {company.city ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {company.city}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditClick(company)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteMutation.mutate(company.id)}
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

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Firma bulunamadı</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Arama kriterlerinize uygun firma bulunamadı.' : 'Henüz firma eklenmemiş.'}
          </p>
          <Button onClick={() => setShowFormModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            İlk firmayı ekle
          </Button>
        </div>
      )}

      <CompanyFormModal 
        open={showFormModal}
        onOpenChange={handleCloseModal}
        company={editingCompany}
      />
    </div>
  );
};

export default Companies;
