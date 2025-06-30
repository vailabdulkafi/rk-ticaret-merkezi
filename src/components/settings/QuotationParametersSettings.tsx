import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface QuotationParameter {
  id: string;
  name: string;
  value: {
    parameter_type: string;
    is_required: boolean;
    default_value: string;
  };
  language: string;
  created_at: string;
}

const QuotationParametersSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [newParameter, setNewParameter] = useState({
    name: '',
    parameter_type: 'text',
    is_required: false,
    default_value: '',
    language: 'TR'
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: parameters, isLoading } = useQuery({
    queryKey: ['quotation-parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('setting_type', 'quotation_parameter')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Cast the data to QuotationParameter type with proper value structure
      return data.map(item => ({
        ...item,
        value: item.value as {
          parameter_type: string;
          is_required: boolean;
          default_value: string;
        }
      })) as QuotationParameter[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (parameterData: typeof newParameter) => {
      const { error } = await supabase
        .from('company_settings')
        .insert({
          setting_type: 'quotation_parameter',
          name: parameterData.name,
          value: {
            parameter_type: parameterData.parameter_type,
            is_required: parameterData.is_required,
            default_value: parameterData.default_value
          },
          language: parameterData.language as any,
          created_by: user?.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation-parameters'] });
      toast.success('Parametre başarıyla eklendi');
      setNewParameter({
        name: '',
        parameter_type: 'text',
        is_required: false,
        default_value: '',
        language: 'TR'
      });
      setShowAddForm(false);
    },
    onError: (error) => {
      toast.error('Parametre eklenirken hata oluştu: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('company_settings')
        .update({
          name: data.name,
          value: {
            parameter_type: data.parameter_type,
            is_required: data.is_required,
            default_value: data.default_value
          },
          language: data.language as any
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation-parameters'] });
      toast.success('Parametre başarıyla güncellendi');
      setEditingId(null);
      setEditingData(null);
    },
    onError: (error) => {
      toast.error('Parametre güncellenirken hata oluştu: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParameter.name.trim()) {
      toast.error('Parametre adı zorunludur');
      return;
    }
    createMutation.mutate(newParameter);
  };

  const handleUpdate = (id: string, data: any) => {
    updateMutation.mutate({ id, data });
  };

  const startEdit = (parameter: QuotationParameter) => {
    setEditingId(parameter.id);
    setEditingData({
      name: parameter.name,
      parameter_type: parameter.value.parameter_type,
      is_required: parameter.value.is_required,
      default_value: parameter.value.default_value,
      language: parameter.language
    });
  };

  const saveEdit = () => {
    if (editingId && editingData) {
      handleUpdate(editingId, editingData);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const getParameterTypeText = (type: string) => {
    switch (type) {
      case 'text': return 'Metin';
      case 'number': return 'Sayı';
      case 'select': return 'Seçim';
      case 'boolean': return 'Evet/Hayır';
      default: return type;
    }
  };

  const getLanguageText = (language: string) => {
    switch (language) {
      case 'TR': return 'Türkçe';
      case 'EN': return 'İngilizce';
      case 'PL': return 'Lehçe';
      case 'FR': return 'Fransızca';
      case 'RU': return 'Rusça';
      case 'DE': return 'Almanca';
      case 'AR': return 'Arapça';
      default: return language;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Teklif Parametreleri
            </CardTitle>
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Yeni Parametre
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mb-4">
            Tekliflerde kullanılacak parametreleri buradan yönetebilirsiniz. 
            Bu parametreler matris sisteminde kullanılacaktır.
          </div>

          {showAddForm && (
            <Card className="mb-6 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Yeni Parametre Ekle</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Parametre Adı *</Label>
                      <Input
                        id="name"
                        value={newParameter.name}
                        onChange={(e) => setNewParameter(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Örn: Vinç Kapasitesi"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="parameter_type">Parametre Tipi</Label>
                      <Select
                        value={newParameter.parameter_type}
                        onValueChange={(value) => setNewParameter(prev => ({ ...prev, parameter_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Metin</SelectItem>
                          <SelectItem value="number">Sayı</SelectItem>
                          <SelectItem value="select">Seçim</SelectItem>
                          <SelectItem value="boolean">Evet/Hayır</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="default_value">Varsayılan Değer</Label>
                      <Input
                        id="default_value"
                        value={newParameter.default_value}
                        onChange={(e) => setNewParameter(prev => ({ ...prev, default_value: e.target.value }))}
                        placeholder="Varsayılan değer"
                      />
                    </div>

                    <div>
                      <Label htmlFor="language">Dil</Label>
                      <Select
                        value={newParameter.language}
                        onValueChange={(value) => setNewParameter(prev => ({ ...prev, language: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TR">Türkçe</SelectItem>
                          <SelectItem value="EN">İngilizce</SelectItem>
                          <SelectItem value="PL">Lehçe</SelectItem>
                          <SelectItem value="FR">Fransızca</SelectItem>
                          <SelectItem value="RU">Rusça</SelectItem>
                          <SelectItem value="DE">Almanca</SelectItem>
                          <SelectItem value="AR">Arapça</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_required"
                      checked={newParameter.is_required}
                      onChange={(e) => setNewParameter(prev => ({ ...prev, is_required: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="is_required">Zorunlu parametre</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {createMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      <X className="h-4 w-4" />
                      İptal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {parameters && parameters.length > 0 ? (
              parameters.map((parameter) => (
                <Card key={parameter.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    {editingId === parameter.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Parametre Adı</Label>
                            <Input
                              value={editingData?.name || ''}
                              onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Parametre Tipi</Label>
                            <Select
                              value={editingData?.parameter_type || 'text'}
                              onValueChange={(value) => setEditingData(prev => ({ ...prev, parameter_type: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Metin</SelectItem>
                                <SelectItem value="number">Sayı</SelectItem>
                                <SelectItem value="select">Seçim</SelectItem>
                                <SelectItem value="boolean">Evet/Hayır</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Varsayılan Değer</Label>
                            <Input
                              value={editingData?.default_value || ''}
                              onChange={(e) => setEditingData(prev => ({ ...prev, default_value: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Dil</Label>
                            <Select
                              value={editingData?.language || 'TR'}
                              onValueChange={(value) => setEditingData(prev => ({ ...prev, language: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TR">Türkçe</SelectItem>
                                <SelectItem value="EN">İngilizce</SelectItem>
                                <SelectItem value="PL">Lehçe</SelectItem>
                                <SelectItem value="FR">Fransızca</SelectItem>
                                <SelectItem value="RU">Rusça</SelectItem>
                                <SelectItem value="DE">Almanca</SelectItem>
                                <SelectItem value="AR">Arapça</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingData?.is_required || false}
                            onChange={(e) => setEditingData(prev => ({ ...prev, is_required: e.target.checked }))}
                            className="rounded"
                          />
                          <Label>Zorunlu parametre</Label>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={saveEdit}
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4" />
                            İptal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-lg">{parameter.name}</h3>
                            <Badge variant="outline">
                              {getParameterTypeText(parameter.value.parameter_type)}
                            </Badge>
                            <Badge variant="secondary">
                              {getLanguageText(parameter.language)}
                            </Badge>
                            {parameter.value.is_required && (
                              <Badge variant="destructive">Zorunlu</Badge>
                            )}
                          </div>
                          
                          {parameter.value.default_value && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Varsayılan: </span>
                              {parameter.value.default_value}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(parameter)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(parameter.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz parametre eklenmemiş</h3>
                <p className="text-gray-600 mb-4">
                  Tekliflerinizde kullanmak için parametreler ekleyin
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk parametreyi ekle
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotationParametersSettings;
