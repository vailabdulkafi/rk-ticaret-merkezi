
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

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
}

interface ProductFormData {
  name: string;
  description: string;
  unit_price: string;
  currency: string;
  unit: string;
  stock_quantity: string;
  brand: string;
  model: string;
  category_id: string;
  hs_code: string;
  warranty_period: string;
}

const ProductFormModal = ({ open, onOpenChange, product }: ProductFormModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    unit_price: '',
    currency: 'TRY',
    unit: 'adet',
    stock_quantity: '0',
    brand: '',
    model: '',
    category_id: '',
    hs_code: '',
    warranty_period: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        unit_price: product.unit_price?.toString() || '',
        currency: product.currency || 'TRY',
        unit: product.unit || 'adet',
        stock_quantity: product.stock_quantity?.toString() || '0',
        brand: product.brand || '',
        model: product.model || '',
        category_id: product.category_id || '',
        hs_code: product.hs_code || '',
        warranty_period: product.warranty_period || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        unit_price: '',
        currency: 'TRY',
        unit: 'adet',
        stock_quantity: '0',
        brand: '',
        model: '',
        category_id: '',
        hs_code: '',
        warranty_period: ''
      });
    }
  }, [product, open]);

  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı');
      
      const { error } = await supabase
        .from('products')
        .insert({
          name: data.name,
          description: data.description,
          unit_price: parseFloat(data.unit_price),
          currency: data.currency,
          unit: data.unit,
          stock_quantity: parseInt(data.stock_quantity),
          brand: data.brand || null,
          model: data.model || null,
          category_id: data.category_id || null,
          hs_code: data.hs_code || null,
          warranty_period: data.warranty_period || null,
          created_by: user.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Ürün başarıyla eklendi');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Ürün eklenirken hata oluştu: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!product?.id) throw new Error('Ürün ID bulunamadı');
      
      const { error } = await supabase
        .from('products')
        .update({
          name: data.name,
          description: data.description,
          unit_price: parseFloat(data.unit_price),
          currency: data.currency,
          unit: data.unit,
          stock_quantity: parseInt(data.stock_quantity),
          brand: data.brand || null,
          model: data.model || null,
          category_id: data.category_id || null,
          hs_code: data.hs_code || null,
          warranty_period: data.warranty_period || null,
        })
        .eq('id', product.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Ürün başarıyla güncellendi');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Ürün güncellenirken hata oluştu: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Ürün adı zorunludur');
      return;
    }
    if (!formData.unit_price || parseFloat(formData.unit_price) < 0) {
      toast.error('Geçerli bir birim fiyat giriniz');
      return;
    }
    
    if (product) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? 'Ürün Güncelle' : 'Yeni Ürün Ekle'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Ürün Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="category_id">Kategori</Label>
              <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="brand">Marka</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="Ürün markası"
              />
            </div>

            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="Ürün modeli"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="unit_price">Birim Fiyat *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => handleInputChange('unit_price', e.target.value)}
                required
              />
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
              <Label htmlFor="unit">Birim</Label>
              <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adet">Adet</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="lt">Litre</SelectItem>
                  <SelectItem value="m">Metre</SelectItem>
                  <SelectItem value="m2">m²</SelectItem>
                  <SelectItem value="paket">Paket</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="stock_quantity">Stok Miktarı</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="hs_code">HS Kodu</Label>
              <Input
                id="hs_code"
                value={formData.hs_code}
                onChange={(e) => handleInputChange('hs_code', e.target.value)}
                placeholder="HS kodu"
              />
            </div>

            <div>
              <Label htmlFor="warranty_period">Garanti Süresi</Label>
              <Input
                id="warranty_period"
                value={formData.warranty_period}
                onChange={(e) => handleInputChange('warranty_period', e.target.value)}
                placeholder="Örn: 2 yıl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (product ? 'Güncelleniyor...' : 'Ekleniyor...') : (product ? 'Ürün Güncelle' : 'Ürün Ekle')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;
