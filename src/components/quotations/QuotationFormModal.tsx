import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface QuotationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuotationFormData {
  title: string;
  company_id: string;
  quotation_number: string;
  quotation_date: Date;
  valid_until: string;
  currency: string;
  language: string;
  prepared_by: string;
  reviewed_by: string;
  notes: string;
}

interface SelectedProduct {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
  discount_percentage: number;
  selected_matrix_id?: string;
  custom_properties?: Record<string, any>;
}

interface QuotationParameter {
  id: string;
  name: string;
  value: {
    parameter_type: string;
    is_required: boolean;
    default_value: string;
  };
  language: string;
}

const QuotationFormModal = ({ open, onOpenChange }: QuotationFormModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<QuotationFormData>({
    title: '',
    company_id: '',
    quotation_number: '',
    quotation_date: new Date(),
    valid_until: '',
    currency: 'TRY',
    language: 'TR',
    prepared_by: user?.id || '',
    reviewed_by: '',
    notes: ''
  });

  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [quotationParameters, setQuotationParameters] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('basic');

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('first_name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, unit_price, currency, description, 
          brand, model, hs_code, warranty_period,
          product_categories(name)
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: parameters } = useQuery({
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
    mutationFn: async (data: QuotationFormData & { products: SelectedProduct[]; parameters: Record<string, any> }) => {
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı');
      
      const totalAmount = data.products.reduce((sum, product) => {
        const discountedPrice = product.unit_price * (1 - product.discount_percentage / 100);
        return sum + (discountedPrice * product.quantity);
      }, 0);

      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .insert({
          title: data.title,
          company_id: data.company_id,
          quotation_number: data.quotation_number,
          quotation_date: data.quotation_date.toISOString().split('T')[0],
          valid_until: data.valid_until || null,
          currency: data.currency,
          language: data.language as any,
          prepared_by: data.prepared_by || null,
          reviewed_by: data.reviewed_by || null,
          notes: data.notes,
          total_amount: totalAmount,
          created_by: user.id
        })
        .select()
        .single();
      
      if (quotationError) throw quotationError;

      // Ürünleri ekle
      if (data.products.length > 0) {
        const quotationItems = data.products.map(product => ({
          quotation_id: quotation.id,
          product_id: product.id,
          quantity: product.quantity,
          unit_price: product.unit_price,
          discount_percentage: product.discount_percentage,
          total_price: product.unit_price * product.quantity * (1 - product.discount_percentage / 100),
          selected_matrix_id: product.selected_matrix_id || null,
          custom_properties: { 
            ...product.custom_properties,
            quotation_parameters: data.parameters
          }
        }));

        const { error: itemsError } = await supabase
          .from('quotation_items')
          .insert(quotationItems);
        
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Teklif başarıyla oluşturuldu');
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Teklif oluşturulurken hata oluştu: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Teklif başlığı zorunludur');
      return;
    }
    if (!formData.company_id) {
      toast.error('Firma seçimi zorunludur');
      return;
    }
    if (!formData.quotation_number.trim()) {
      toast.error('Teklif numarası zorunludur');
      return;
    }
    
    // Zorunlu parametreleri kontrol et
    const requiredParams = parameters?.filter(p => p.value.is_required) || [];
    for (const param of requiredParams) {
      if (!quotationParameters[param.id] || quotationParameters[param.id].toString().trim() === '') {
        toast.error(`${param.name} parametresi zorunludur`);
        return;
      }
    }
    
    createMutation.mutate({ 
      ...formData, 
      products: selectedProducts,
      parameters: quotationParameters
    });
  };

  const handleInputChange = (field: keyof QuotationFormData, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateQuotationNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const quotationNumber = `TK-${year}-${random}`;
    handleInputChange('quotation_number', quotationNumber);
  };

  const addProduct = (product: any) => {
    const newProduct: SelectedProduct = {
      id: product.id,
      name: product.name,
      unit_price: product.unit_price,
      quantity: 1,
      discount_percentage: 0
    };
    setSelectedProducts(prev => [...prev, newProduct]);
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof SelectedProduct, value: any) => {
    setSelectedProducts(prev => prev.map((product, i) => 
      i === index ? { ...product, [field]: value } : product
    ));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company_id: '',
      quotation_number: '',
      quotation_date: new Date(),
      valid_until: '',
      currency: 'TRY',
      language: 'TR',
      prepared_by: user?.id || '',
      reviewed_by: '',
      notes: ''
    });
    setSelectedProducts([]);
    setQuotationParameters({});
    setActiveTab('basic');
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, product) => {
      const discountedPrice = product.unit_price * (1 - product.discount_percentage / 100);
      return sum + (discountedPrice * product.quantity);
    }, 0);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const handleParameterChange = (parameterId: string, value: any) => {
    setQuotationParameters(prev => ({
      ...prev,
      [parameterId]: value
    }));
  };

  useEffect(() => {
    if (open && user) {
      setFormData(prev => ({ ...prev, prepared_by: user.id }));
      generateQuotationNumber();
    }
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gelişmiş Teklif Oluştur</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Temel Bilgiler</TabsTrigger>
            <TabsTrigger value="parameters">Teklif Parametreleri</TabsTrigger>
            <TabsTrigger value="products">Ürün Seçimi</TabsTrigger>
            <TabsTrigger value="summary">Özet & Kaydet</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Teklif Başlığı *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="company_id">Firma *</Label>
                  <Select value={formData.company_id} onValueChange={(value) => handleInputChange('company_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Firma seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies?.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quotation_number">Teklif Numarası *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="quotation_number"
                      value={formData.quotation_number}
                      onChange={(e) => handleInputChange('quotation_number', e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateQuotationNumber}
                    >
                      Oluştur
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Teklif Tarihi</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.quotation_date ? format(formData.quotation_date, "dd MMMM yyyy", { locale: tr }) : "Tarih seçin"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.quotation_date}
                        onSelect={(date) => date && handleInputChange('quotation_date', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="language">Teklif Dili</Label>
                  <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
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

                <div>
                  <Label htmlFor="currency">Para Birimi</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">TRY</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="prepared_by">Teklifi Hazırlayan</Label>
                  <Select value={formData.prepared_by} onValueChange={(value) => handleInputChange('prepared_by', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kişi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles?.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.first_name} {profile.last_name} ({profile.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reviewed_by">Teklifi Kontrol Eden</Label>
                  <Select value={formData.reviewed_by} onValueChange={(value) => handleInputChange('reviewed_by', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kişi seçin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles?.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.first_name} {profile.last_name} ({profile.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="valid_until">Geçerlilik Tarihi</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => handleInputChange('valid_until', e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Notlar</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => setActiveTab('parameters')}
                >
                  Parametrelere Geç
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="parameters" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Teklif Parametreleri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {parameters && parameters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {parameters.map((parameter) => (
                        <div key={parameter.id}>
                          <Label htmlFor={parameter.id}>
                            {parameter.name}
                            {parameter.value.is_required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {parameter.value.parameter_type === 'text' && (
                            <Input
                              id={parameter.id}
                              value={quotationParameters[parameter.id] || parameter.value.default_value || ''}
                              onChange={(e) => handleParameterChange(parameter.id, e.target.value)}
                              placeholder={parameter.value.default_value}
                              required={parameter.value.is_required}
                            />
                          )}
                          {parameter.value.parameter_type === 'number' && (
                            <Input
                              id={parameter.id}
                              type="number"
                              value={quotationParameters[parameter.id] || parameter.value.default_value || ''}
                              onChange={(e) => handleParameterChange(parameter.id, e.target.value)}
                              placeholder={parameter.value.default_value}
                              required={parameter.value.is_required}
                            />
                          )}
                          {parameter.value.parameter_type === 'boolean' && (
                            <Select 
                              value={quotationParameters[parameter.id] || parameter.value.default_value || ''}
                              onValueChange={(value) => handleParameterChange(parameter.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Evet</SelectItem>
                                <SelectItem value="false">Hayır</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">
                        Henüz teklif parametresi tanımlanmamış. 
                        Ayarlar sayfasından parametreler ekleyebilirsiniz.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('basic')}
                >
                  Geri
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab('products')}
                >
                  Ürün Seçimine Geç
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mevcut Ürünler</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {products?.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-600">
                            {product.brand} {product.model} - {formatPrice(product.unit_price, product.currency)}
                          </p>
                          {product.product_categories && (
                            <Badge variant="outline" className="mt-1">
                              {product.product_categories.name}
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addProduct(product)}
                          disabled={selectedProducts.some(p => p.id === product.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Seçili Ürünler ({selectedProducts.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedProducts.map((product, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{product.name}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label>Miktar</Label>
                            <Input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div>
                            <Label>Birim Fiyat</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={product.unit_price}
                              onChange={(e) => updateProduct(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label>İskonto %</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={product.discount_percentage}
                              onChange={(e) => updateProduct(index, 'discount_percentage', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-sm text-gray-600">Toplam: </span>
                          <span className="font-medium">
                            {formatPrice(
                              product.unit_price * product.quantity * (1 - product.discount_percentage / 100),
                              formData.currency
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('parameters')}
                >
                  Geri
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                >
                  Özete Geç
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Teklif Özeti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Teklif Başlığı</Label>
                      <p className="text-sm">{formData.title}</p>
                    </div>
                    <div>
                      <Label>Teklif Numarası</Label>
                      <p className="text-sm">{formData.quotation_number}</p>
                    </div>
                    <div>
                      <Label>Firma</Label>
                      <p className="text-sm">
                        {companies?.find(c => c.id === formData.company_id)?.name}
                      </p>
                    </div>
                    <div>
                      <Label>Dil</Label>
                      <p className="text-sm">{formData.language}</p>
                    </div>
                  </div>

                  {parameters && parameters.length > 0 && (
                    <div>
                      <Label>Parametreler</Label>
                      <div className="space-y-1 mt-2">
                        {parameters.map((parameter) => (
                          <div key={parameter.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                            <span>{parameter.name}:</span>
                            <span className="font-medium">
                              {quotationParameters[parameter.id] || parameter.value.default_value || '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Seçili Ürünler ({selectedProducts.length})</Label>
                    <div className="space-y-2 mt-2">
                      {selectedProducts.map((product, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>{product.name} x{product.quantity}</span>
                          <span className="font-medium">
                            {formatPrice(
                              product.unit_price * product.quantity * (1 - product.discount_percentage / 100),
                              formData.currency
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Toplam Tutar:</span>
                      <span>{formatPrice(calculateTotal(), formData.currency)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('products')}
                >
                  Geri
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Oluşturuluyor...' : 'Teklif Oluştur'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationFormModal;
