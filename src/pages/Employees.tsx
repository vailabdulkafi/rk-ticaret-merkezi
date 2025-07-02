import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, User, Edit, Trash2, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { EmployeeFormModal } from '@/components/employees/EmployeeFormModal';

const Employees = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
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
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Çalışan başarıyla silindi');
    },
    onError: (error) => {
      toast.error('Çalışan silinirken hata oluştu: ' + error.message);
    },
  });

  const filteredEmployees = employees?.filter(employee =>
    `${employee.profiles?.first_name || ''} ${employee.profiles?.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setShowFormModal(true);
  };

  const handleAddNew = () => {
    setSelectedEmployee(null);
    setShowFormModal(true);
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
          <h1 className="text-2xl font-bold text-gray-900">Çalışanlar</h1>
          <p className="text-gray-600">Şirket çalışanlarını yönetin</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={handleAddNew}
        >
          <Plus className="h-4 w-4" />
          Çalışan Ekle
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Çalışan ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredEmployees.length} çalışan bulundu
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Pozisyon</TableHead>
                <TableHead>Departman</TableHead>
                <TableHead>İletişim</TableHead>
                <TableHead>İşe Giriş</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      {employee.profiles?.first_name} {employee.profiles?.last_name}
                    </div>
                  </TableCell>
                  <TableCell>{employee.position || '-'}</TableCell>
                  <TableCell>{employee.department || '-'}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {employee.profiles?.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {employee.profiles.email}
                        </div>
                      )}
                      {employee.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {employee.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {employee.hire_date && new Date(employee.hire_date).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.is_active ? "default" : "secondary"}>
                      {employee.is_active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteMutation.mutate(employee.id)}
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

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Çalışan bulunamadı</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Arama kriterlerinize uygun çalışan bulunamadı.' : 'Henüz çalışan eklenmemiş.'}
          </p>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            İlk çalışanı ekle
          </Button>
        </div>
      )}

      <EmployeeFormModal 
        open={showFormModal}
        onOpenChange={setShowFormModal}
        employee={selectedEmployee}
      />
    </div>
  );
};

export default Employees;
