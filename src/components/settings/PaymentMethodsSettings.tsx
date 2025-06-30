
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Banknote, Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type LanguageType = 'TR' | 'EN' | 'PL' | 'FR' | 'RU' | 'DE' | 'AR';

interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
  language: LanguageType | null;
  is_active: boolean | null;
}

const PaymentMethodsSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'TR' as LanguageType,
    is_active: true
  });

  const { data: methods, isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PaymentMethod[];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update(data)
          .eq('id', editingMethod.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert({ ...data, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success(editingMethod ? 'Ödeme şekli güncellendi' : 'Ödeme şekli eklendi');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Hata: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Ödeme şekli silindi');
    },
    onError: (error) => {
      toast.error('Hata: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      language: 'TR' as LanguageType,
      is_active: true
    });
    setEditingMethod(null);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      description: method.description || '',
      language: (method.language || 'TR') as LanguageType,
      is_active: method.is_active !== false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Ödeme Şekilleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Ödeme Şekilleri
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Ödeme Şekli
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMethod ? 'Ödeme Şeklini Düzenle' : 'Yeni Ödeme Şekli'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Ödeme Şekli Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Örn: Kredi Kartı, Havale, Nakit"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ödeme şekli hakkında detaylı bilgi"
                  />
                </div>
                <div>
                  <Label htmlFor="language">Dil</Label>
                  <Select value={formData.language} onValueChange={(value: LanguageType) => setFormData({ ...formData, language: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TR">Türkçe</SelectItem>
                      <SelectItem value="EN">İngilizce</SelectItem>
                      <SelectItem value="DE">Almanca</SelectItem>
                      <SelectItem value="FR">Fransızca</SelectItem>
                      <SelectItem value="RU">Rusça</SelectItem>
                      <SelectItem value="AR">Arapça</SelectItem>
                      <SelectItem value="PL">Lehçe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    İptal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {methods?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Henüz ödeme şekli eklenmemiş.</p>
        ) : (
          <div className="space-y-4">
            {methods?.map((method) => (
              <div key={method.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{method.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                        method.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {method.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                      {method.language && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {method.language}
                        </span>
                      )}
                    </div>
                    {method.description && <p className="text-gray-600 mt-2">{method.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(method)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(method.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodsSettings;
