
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Package } from 'lucide-react';

interface QuotationItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation?: any;
}

interface QuotationItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_percentage?: number;
}

const QuotationItemsModal = ({ open, onOpenChange, quotation }: QuotationItemsModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [discount, setDiscount] = useState(0);

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_properties (
            property_name,
            property_value,
            language,
            show_in_quotation
          )
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && open,
  });

  const { data: quotationItems } = useQuery({
    queryKey: ['quotation-items', quotation?.id],
    queryFn: async () => {
      if (!quotation?.id) return [];
      
      const { data, error } = await supabase
        .from('quotation_items')
        .select(`
          *,
          products (
            name,
            brand,
            model,
            product_properties (
              property_name,
              property_value,
              language,
              show_in_quotation
            )
          )
        `)
        .eq('quotation_id', quotation.id)
        .order('created_at');
      
      if (error) throw error;
      return data;
    },
    enabled: !!quotation?.id && open,
  });

  useEffect(() => {
    if (quotationItems) {
      setItems(quotationItems.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount_percentage: item.discount_percentage || 0
      })));
    }
  }, [quotationItems]);

  const addItemMutation = useMutation({
    mutationFn: async (item: QuotationItem) => {
      if (!quotation?.id) throw new Error('Teklif ID bulunamadı');
      
      const { error } = await supabase
        .from('quotation_items')
        .insert({
          quotation_id: quotation.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          discount_percentage: item.discount_percentage
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation-items', quotation?.id] });
      updateQuotationTotal();
      toast.success('Ürün eklendi');
      resetForm();
    },
    onError: (error) => {
      toast.error('Ürün eklenirken hata oluştu: ' + error.message);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('quotation_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation-items', quotation?.id] });
      updateQuotationTotal();
      toast.success('Ürün silindi');
    },
    onError: (error) => {
      toast.error('Ürün silinirken hata oluştu: ' + error.message);
    },
  });

  const updateQuotationTotal = async () => {
    if (!quotation?.id) return;
    
    const { data: items } = await supabase
      .from('quotation_items')
      .select('total_price')
      .eq('quotation_id', quotation.id);
    
    const totalAmount = items?.reduce((sum, item) => sum + item.total_price, 0) || 0;
    
    await supabase
      .from('quotations')
      .update({ total_amount: totalAmount })
      .eq('id', quotation.id);
    
    queryClient.invalidateQueries({ queryKey: ['quotations'] });
  };

  const handleAddItem = () => {
    if (!selectedProductId || quantity <= 0) {
      toast.error('Lütfen ürün seçin ve miktarı belirtin');
      return;
    }

    const discountedPrice = unitPrice * (1 - discount / 100);
    const totalPrice = discountedPrice * quantity;

    const newItem: QuotationItem = {
      product_id: selectedProductId,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      discount_percentage: discount
    };

    addItemMutation.mutate(newItem);
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products?.find(p => p.id === productId);
    if (product) {
      setUnitPrice(product.unit_price);
    }
  };

  const resetForm = () => {
    setSelectedProductId('');
    setQuantity(1);
    setUnitPrice(0);
    setDiscount(0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: quotation?.currency || 'TRY',
    }).format(price);
  };

  const totalAmount = quotationItems?.reduce((sum, item) => sum + item.total_price, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Teklif Ürünleri - {quotation?.quotation_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Ürün Ekleme Formu */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Yeni Ürün Ekle</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="product">Ürün *</Label>
                <Select value={selectedProductId} onValueChange={handleProductSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ürün seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {product.brand || ''} {product.model || ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="quantity">Miktar *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div>
                <Label htmlFor="unit_price">Birim Fiyat</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label htmlFor="discount">İndirim (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Toplam: {formatPrice((unitPrice * (1 - discount / 100)) * quantity)}
              </div>
              <Button 
                onClick={handleAddItem}
                disabled={addItemMutation.isPending}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ürün Ekle
              </Button>
            </div>
          </div>

          {/* Ürün Listesi */}
          <div>
            <h3 className="text-lg font-medium mb-4">Teklif Ürünleri</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Birim Fiyat</TableHead>
                  <TableHead>İndirim</TableHead>
                  <TableHead>Toplam</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotationItems?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{item.products?.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.products?.brand} {item.products?.model}
                          </div>
                          {item.products?.product_properties?.filter(p => p.show_in_quotation).map((prop, index) => (
                            <Badge key={index} variant="outline" className="mr-1 text-xs">
                              {prop.property_name}: {prop.property_value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatPrice(item.unit_price)}</TableCell>
                    <TableCell>{item.discount_percentage || 0}%</TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(item.total_price)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItemMutation.mutate(item.id)}
                        disabled={deleteItemMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {quotationItems && quotationItems.length > 0 && (
              <div className="mt-4 text-right">
                <div className="text-lg font-bold">
                  Genel Toplam: {formatPrice(totalAmount)}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationItemsModal;
