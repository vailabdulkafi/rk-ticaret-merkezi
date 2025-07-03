import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface EmployeeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: any;
}

type EmployeeRole = 'employee' | 'specialist' | 'manager' | 'director';

interface EmployeeFormData {
  employee_number: string;
  department: string;
  position: string;
  hire_date: string;
  phone: string;
  address: string;
  user_id: string;
  roles: EmployeeRole[];
  manager_id: string;
}

export function EmployeeFormModal({ open, onOpenChange, employee }: EmployeeFormModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<EmployeeFormData>({
    employee_number: '',
    department: '',
    position: '',
    hire_date: '',
    phone: '',
    address: '',
    user_id: '',
    roles: ['employee'],
    manager_id: ''
  });

  // Kullanıcıları getir
  const { data: users } = useQuery({
    queryKey: ['users-for-employee'],
    queryFn: async () => {
      console.log('Kullanıcılar yükleniyor...');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('first_name');
      
      if (error) {
        console.error('Kullanıcı yükleme hatası:', error);
        throw error;
      }
      console.log('Yüklenen kullanıcılar:', data);
      return data;
    }
  });

  // Müdürleri getir
  const { data: managers } = useQuery({
    queryKey: ['managers'],
    queryFn: async () => {
      console.log('Müdürler yükleniyor...');
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          profiles!employees_user_id_fkey(first_name, last_name),
          employee_roles!inner(role)
        `)
        .eq('is_active', true)
        .in('employee_roles.role', ['manager', 'director'])
        .eq('employee_roles.is_active', true);
      
      if (error) {
        console.error('Müdür yükleme hatası:', error);
        throw error;
      }
      console.log('Yüklenen müdürler:', data);
      return data;
    }
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        employee_number: employee.employee_number || '',
        department: employee.department || '',
        position: employee.position || '',
        hire_date: employee.hire_date || '',
        phone: employee.phone || '',
        address: employee.address || '',
        user_id: employee.user_id || '',
        roles: employee.employee_roles?.filter((r: any) => r.is_active).map((r: any) => r.role) || ['employee'],
        manager_id: employee.manager?.[0]?.manager?.id || ''
      });
    } else {
      setFormData({
        employee_number: '',
        department: '',
        position: '',
        hire_date: '',
        phone: '',
        address: '',
        user_id: '',
        roles: ['employee'],
        manager_id: ''
      });
    }
  }, [employee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form gönderiliyor:', formData);
    
    if (!formData.user_id) {
      toast.error('Lütfen bir kullanıcı seçin');
      return;
    }

    if (employee) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleRoleChange = (role: EmployeeRole, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        roles: [...prev.roles, role]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        roles: prev.roles.filter(r => r !== role)
      }));
    }
  };

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    onOpenChange(false);
  };

  const createMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      console.log('Çalışan oluşturuluyor:', data);
      
      // Çalışan oluştur
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .insert({
          employee_number: data.employee_number,
          department: data.department,
          position: data.position,
          hire_date: data.hire_date || null,
          phone: data.phone,
          address: data.address,
          user_id: data.user_id,
          created_by: user?.id
        })
        .select()
        .single();

      if (employeeError) {
        console.error('Çalışan oluşturma hatası:', employeeError);
        throw employeeError;
      }

      console.log('Çalışan oluşturuldu:', employeeData);

      // Rolleri ekle
      if (data.roles.length > 0) {
        const roleInserts = data.roles.map(role => ({
          employee_id: employeeData.id,
          role,
          assigned_by: user?.id
        }));

        console.log('Roller ekleniyor:', roleInserts);

        const { error: rolesError } = await supabase
          .from('employee_roles')
          .insert(roleInserts);

        if (rolesError) {
          console.error('Rol ekleme hatası:', rolesError);
          throw rolesError;
        }
      }

      // Müdür ataması varsa hiyerarşi ekle
      if (data.manager_id) {
        console.log('Hiyerarşi ekleniyor:', data.manager_id);
        
        const { error: hierarchyError } = await supabase
          .from('employee_hierarchy')
          .insert({
            employee_id: employeeData.id,
            manager_id: data.manager_id,
            created_by: user?.id
          });

        if (hierarchyError) {
          console.error('Hiyerarşi ekleme hatası:', hierarchyError);
          throw hierarchyError;
        }
      }

      return employeeData;
    },
    onSuccess: () => {
      console.log('Çalışan başarıyla oluşturuldu');
      toast.success('Çalışan başarıyla oluşturuldu');
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Çalışan oluşturma genel hatası:', error);
      toast.error('Çalışan oluşturulurken hata oluştu: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      console.log('Çalışan güncelleniyor:', data);
      
      // Çalışan güncelle
      const { error: employeeError } = await supabase
        .from('employees')
        .update({
          employee_number: data.employee_number,
          department: data.department,
          position: data.position,
          hire_date: data.hire_date || null,
          phone: data.phone,
          address: data.address,
          user_id: data.user_id
        })
        .eq('id', employee.id);

      if (employeeError) {
        console.error('Çalışan güncelleme hatası:', employeeError);
        throw employeeError;
      }

      // Mevcut rolleri pasif yap
      const { error: deactivateRolesError } = await supabase
        .from('employee_roles')
        .update({ is_active: false })
        .eq('employee_id', employee.id);

      if (deactivateRolesError) {
        console.error('Rol pasifleştirme hatası:', deactivateRolesError);
        throw deactivateRolesError;
      }

      // Yeni rolleri ekle
      if (data.roles.length > 0) {
        const roleInserts = data.roles.map(role => ({
          employee_id: employee.id,
          role,
          assigned_by: user?.id
        }));

        const { error: rolesError } = await supabase
          .from('employee_roles')
          .insert(roleInserts);

        if (rolesError) {
          console.error('Yeni rol ekleme hatası:', rolesError);
          throw rolesError;
        }
      }

      // Mevcut hiyerarşiyi sil
      const { error: deleteHierarchyError } = await supabase
        .from('employee_hierarchy')
        .delete()
        .eq('employee_id', employee.id);

      if (deleteHierarchyError) {
        console.error('Hiyerarşi silme hatası:', deleteHierarchyError);
        throw deleteHierarchyError;
      }

      // Yeni müdür ataması varsa hiyerarşi ekle
      if (data.manager_id) {
        const { error: hierarchyError } = await supabase
          .from('employee_hierarchy')
          .insert({
            employee_id: employee.id,
            manager_id: data.manager_id,
            created_by: user?.id
          });

        if (hierarchyError) {
          console.error('Yeni hiyerarşi ekleme hatası:', hierarchyError);
          throw hierarchyError;
        }
      }
    },
    onSuccess: () => {
      console.log('Çalışan başarıyla güncellendi');
      toast.success('Çalışan başarıyla güncellendi');
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Çalışan güncelleme genel hatası:', error);
      toast.error('Çalışan güncellenirken hata oluştu: ' + error.message);
    }
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? 'Çalışan Düzenle' : 'Yeni Çalışan'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="user_id">Kullanıcı *</Label>
              <Select
                value={formData.user_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kullanıcı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="employee_number">Sicil Numarası</Label>
              <Input
                id="employee_number"
                value={formData.employee_number}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_number: e.target.value }))}
                placeholder="Sicil numarası"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Departman</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Departman"
              />
            </div>

            <div>
              <Label htmlFor="position">Pozisyon</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                placeholder="Pozisyon"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hire_date">İşe Başlama Tarihi</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Telefon numarası"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Adres</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Adres"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="manager_id">Müdür</Label>
            <Select
              value={formData.manager_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, manager_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Müdür seçin (opsiyonel)" />
              </SelectTrigger>
              <SelectContent>
                {managers?.map(manager => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.profiles?.first_name} {manager.profiles?.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Roller</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="employee"
                  checked={formData.roles.includes('employee')}
                  onCheckedChange={(checked) => handleRoleChange('employee', !!checked)}
                />
                <Label htmlFor="employee">Çalışan</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="specialist"
                  checked={formData.roles.includes('specialist')}
                  onCheckedChange={(checked) => handleRoleChange('specialist', !!checked)}
                />
                <Label htmlFor="specialist">Uzman</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="manager"
                  checked={formData.roles.includes('manager')}
                  onCheckedChange={(checked) => handleRoleChange('manager', !!checked)}
                />
                <Label htmlFor="manager">Müdür</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="director"
                  checked={formData.roles.includes('director')}
                  onCheckedChange={(checked) => handleRoleChange('director', !!checked)}
                />
                <Label htmlFor="director">Direktör</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Kaydediliyor...' : (employee ? 'Güncelle' : 'Kaydet')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
