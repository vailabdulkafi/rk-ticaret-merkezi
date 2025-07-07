
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';

const QuotationParametersSettings = () => {
  const queryClient = useQueryClient();
  const [newParameter, setNewParameter] = useState({
    type: '',
    name: '',
    value: '',
    showInPdf: true
  });

  // Mevcut parametreleri çek
  const { data: parameters, isLoading } = useQuery({
    queryKey: ['quotation-parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .in('setting_type', [
          'countries', 'currencies', 'company_types', 'brands', 
          'quotation_statuses', 'delivery_methods', 'payment_methods',
          'bank_info', 'company_info'
        ])
        .order('setting_type');
      
      if (error) throw error;
      return data;
    },
  });

  // Yeni parametre ekle
  const addParameterMutation = useMutation({
    mutationFn: async (parameter: any) => {
      const { error } = await supabase
        .from('company_settings')
        .insert({
          setting_type: parameter.type,
          name: parameter.name,
          value: { 
            name: parameter.value, 
            showInPdf: parameter.showInPdf 
          }
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation-parameters'] });
      toast.success('Parametre başarıyla eklendi');
      setNewParameter({ type: '', name: '', value: '', showInPdf: true });
    },
    onError: (error) => {
      toast.error('Parametre eklenirken hata oluştu: ' + error.message);
    },
  });

  // Parametre sil
  const deleteParameterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('company_settings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation-parameters'] });
      toast.success('Parametre başarıyla silindi');
    },
    onError: (error) => {
      toast.error('Parametre silinirken hata oluştu: ' + error.message);
    },
  });

  // PDF'de gösterim durumunu güncelle
  const updatePdfVisibilityMutation = useMutation({
    mutationFn: async ({ id, showInPdf }: { id: string; showInPdf: boolean }) => {
      const parameter = parameters?.find(p => p.id === id);
      if (!parameter) return;

      const updatedValue = {
        ...parameter.value,
        showInPdf
      };

      const { error } = await supabase
        .from('company_settings')
        .update({ value: updatedValue })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation-parameters'] });
      toast.success('PDF görünürlük ayarı güncellendi');
    },
    onError: (error) => {
      toast.error('Güncelleme hatası: ' + error.message);
    },
  });

  const parameterTypes = [
    { value: 'countries', label: 'Ülkeler' },
    { value: 'currencies', label: 'Para Birimleri' },
    { value: 'company_types', label: 'Firma Tipleri' },
    { value: 'brands', label: 'Markalar' },
    { value: 'quotation_statuses', label: 'Teklif Durumları' },
    { value: 'delivery_methods', label: 'Teslim Şartları' },
    { value: 'payment_methods', label: 'Ödeme Şekilleri' },
    { value: 'bank_info', label: 'Banka Bilgileri' },
    { value: 'company_info', label: 'Firma Bilgileri' }
  ];

  const handleAddParameter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParameter.type || !newParameter.name || !newParameter.value) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }
    addParameterMutation.mutate(newParameter);
  };

  const groupedParameters = parameters?.reduce((acc, param) => {
    if (!acc[param.setting_type]) {
      acc[param.setting_type] = [];
    }
    acc[param.setting_type].push(param);
    return acc;
  }, {} as Record<string, any[]>) || {};

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teklif Parametreleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Yeni Parametre Ekleme Formu */}
          <form onSubmit={handleAddParameter} className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-medium">Yeni Parametre Ekle</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="parameter-type">Parametre Tipi</Label>
                <Select 
                  value={newParameter.type} 
                  onValueChange={(value) => setNewParameter(prev => ({...prev, type: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tip seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {parameterTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="parameter-name">Parametre Adı</Label>
                <Input
                  id="parameter-name"
                  value={newParameter.name}
                  onChange={(e) => setNewParameter(prev => ({...prev, name: e.target.value}))}
                  placeholder="Parametre adı"
                />
              </div>
              <div>
                <Label htmlFor="parameter-value">Değer</Label>
                <Input
                  id="parameter-value"
                  value={newParameter.value}
                  onChange={(e) => setNewParameter(prev => ({...prev, value: e.target.value}))}
                  placeholder="Değer"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newParameter.showInPdf}
                  onCheckedChange={(checked) => setNewParameter(prev => ({...prev, showInPdf: checked}))}
                />
                <Label>PDF'de Göster</Label>
              </div>
            </div>
            <Button type="submit" disabled={addParameterMutation.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Parametre Ekle
            </Button>
          </form>

          <Separator />

          {/* Mevcut Parametreler */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Mevcut Parametreler</h3>
            {Object.entries(groupedParameters).map(([type, params]) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {parameterTypes.find(t => t.value === type)?.label || type}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {params.map((param) => (
                      <div key={param.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-4">
                          <span className="font-medium">{param.name}</span>
                          <span className="text-gray-600">
                            {typeof param.value === 'object' ? param.value.name : param.value}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={param.value?.showInPdf ?? true}
                              onCheckedChange={(checked) => 
                                updatePdfVisibilityMutation.mutate({ id: param.id, showInPdf: checked })
                              }
                            />
                            <Label className="text-sm">PDF'de Göster</Label>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteParameterMutation.mutate(param.id)}
                            disabled={deleteParameterMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotationParametersSettings;
