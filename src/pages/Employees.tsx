
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus, Search, Users, UserCheck, UserX, Crown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeFormModal } from '@/components/employees/EmployeeFormModal';
import { toast } from 'sonner';

const Employees = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const { data: employees, isLoading, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          profiles!inner(first_name, last_name, email),
          employee_roles(role, is_active),
          manager:employee_hierarchy!employee_hierarchy_employee_id_fkey(
            manager:employees!employee_hierarchy_manager_id_fkey(
              id,
              profiles!inner(first_name, last_name)
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const { data: currentUserRole } = useQuery({
    queryKey: ['current-user-role'],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('employees')
        .select(`
          employee_roles(role, is_active)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error || !data) return 'employee';
      
      const activeRoles = data.employee_roles?.filter(r => r.is_active) || [];
      if (activeRoles.some(r => r.role === 'director')) return 'director';
      if (activeRoles.some(r => r.role === 'manager')) return 'manager';
      if (activeRoles.some(r => r.role === 'specialist')) return 'specialist';
      return 'employee';
    }
  });

  const canManageEmployees = currentUserRole === 'manager' || currentUserRole === 'director';

  const filteredEmployees = employees?.filter(employee => {
    const fullName = `${employee.profiles?.first_name || ''} ${employee.profiles?.last_name || ''}`.toLowerCase();
    const email = employee.profiles?.email?.toLowerCase() || '';
    const department = employee.department?.toLowerCase() || '';
    const position = employee.position?.toLowerCase() || '';
    
    return fullName.includes(searchTerm.toLowerCase()) ||
           email.includes(searchTerm.toLowerCase()) ||
           department.includes(searchTerm.toLowerCase()) ||
           position.includes(searchTerm.toLowerCase());
  });

  const getRoleDisplay = (roles: any[]) => {
    if (!roles || roles.length === 0) return 'Çalışan';
    
    const activeRoles = roles.filter(r => r.is_active);
    if (activeRoles.length === 0) return 'Çalışan';

    if (activeRoles.some(r => r.role === 'director')) return 'Direktör';
    if (activeRoles.some(r => r.role === 'manager')) return 'Müdür';
    if (activeRoles.some(r => r.role === 'specialist')) return 'Uzman';
    return 'Çalışan';
  };

  const getRoleColor = (roles: any[]) => {
    if (!roles || roles.length === 0) return 'secondary';
    
    const activeRoles = roles.filter(r => r.is_active);
    if (activeRoles.length === 0) return 'secondary';

    if (activeRoles.some(r => r.role === 'director')) return 'destructive';
    if (activeRoles.some(r => r.role === 'manager')) return 'default';
    if (activeRoles.some(r => r.role === 'specialist')) return 'outline';
    return 'secondary';
  };

  const getRoleIcon = (roles: any[]) => {
    if (!roles || roles.length === 0) return Users;
    
    const activeRoles = roles.filter(r => r.is_active);
    if (activeRoles.length === 0) return Users;

    if (activeRoles.some(r => r.role === 'director')) return Crown;
    if (activeRoles.some(r => r.role === 'manager')) return UserCheck;
    if (activeRoles.some(r => r.role === 'specialist')) return UserX;
    return Users;
  };

  const handleEmployeeClick = (employee: any) => {
    if (canManageEmployees || employee.user_id === user?.id) {
      setSelectedEmployee(employee);
      setIsCreateModalOpen(true);
    } else {
      toast.error('Bu çalışanı düzenleme yetkiniz yok');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Çalışanlar</h1>
          <p className="text-gray-600">Şirket çalışanlarını ve rollerini yönetin</p>
        </div>
        {canManageEmployees && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Çalışan
          </Button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Çalışan ara (isim, email, departman, pozisyon)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees?.map((employee) => {
          const RoleIcon = getRoleIcon(employee.employee_roles);
          return (
            <Card 
              key={employee.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleEmployeeClick(employee)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {employee.profiles?.first_name} {employee.profiles?.last_name}
                  </CardTitle>
                  <RoleIcon className="h-5 w-5 text-gray-600" />
                </div>
                <p className="text-sm text-gray-600">{employee.profiles?.email}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rol:</span>
                    <Badge variant={getRoleColor(employee.employee_roles)}>
                      {getRoleDisplay(employee.employee_roles)}
                    </Badge>
                  </div>
                  
                  {employee.department && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Departman:</span>
                      <span className="text-sm">{employee.department}</span>
                    </div>
                  )}
                  
                  {employee.position && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Pozisyon:</span>
                      <span className="text-sm">{employee.position}</span>
                    </div>
                  )}
                  
                  {employee.employee_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Sicil No:</span>
                      <span className="text-sm">{employee.employee_number}</span>
                    </div>
                  )}
                  
                  {employee.manager?.[0]?.manager && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Müdür:</span>
                      <span className="text-sm">
                        {employee.manager[0].manager.profiles?.first_name} {employee.manager[0].manager.profiles?.last_name}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEmployees?.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Çalışan bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Arama kriterinize uygun çalışan bulunamadı.' : 'Henüz hiç çalışan eklenmemiş.'}
          </p>
        </div>
      )}

      <EmployeeFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default Employees;
