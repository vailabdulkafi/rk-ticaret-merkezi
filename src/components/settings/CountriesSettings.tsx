
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Country {
  id: string;
  name: string;
  code: string;
  phone_code: string;
}

const CountriesSettings = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone_code: ''
  });

  const { data: countries, isLoading } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('countries')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast.success('Ülke başarıyla eklendi');
      setShowModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Ülke eklenirken hata oluştu: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from('countries')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast.success('Ülke başarıyla güncellendi');
      setShowModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Ülke güncellenirken hata oluştu: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('countries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      toast.success('Ülke başarıyla silindi');
    },
    onError: (error) => {
      toast.error('Ülke silinirken hata oluştu: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: '', code: '', phone_code: '' });
    setEditingCountry(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (country: Country) => {
    setEditingCountry(country);
    setFormData({
      name: country.name,
      code: country.code,
      phone_code: country.phone_code || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCountry) {
      updateMutation.mutate({ id: editingCountry.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu ülkeyi silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Ülkeler
            </div>
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Ülke
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {countries?.map((country) => (
              <div key={country.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{country.name} ({country.code})</p>
                  {country.phone_code && (
                    <p className="text-sm text-gray-600">Telefon Kodu: {country.phone_code}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(country)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(country.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCountry ? 'Ülke Güncelle' : 'Yeni Ülke Ekle'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Ülke Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="code">Ülke Kodu *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                maxLength={3}
                placeholder="TR, US, DE..."
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone_code">Telefon Kodu</Label>
              <Input
                id="phone_code"
                value={formData.phone_code}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_code: e.target.value }))}
                placeholder="+90, +1, +49..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                İptal
              </Button>
              <Button type="submit">
                {editingCountry ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CountriesSettings;
