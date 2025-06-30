
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface ProductSubItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

const ProductSubItemsModal = ({ open, onOpenChange, product }: ProductSubItemsModalProps) => {
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const { data: products } = useQuery({
    queryKey: ['products-for-subitems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, unit_price, currency')
        .neq('id', product?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: subItems, isLoading } = useQuery({
    queryKey: ['product-subitems', product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_sub_items')
        .select(`
          *,
          sub_product:products!sub_product_id(id, name, unit_price, currency)
        `)
        .eq('parent_product_id', product?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!product?.id && open,
  });

  const addSubItemMutation = useMutation({
    mutationFn: async (data: { sub_product_id: string; quantity: number }) => {
      const { error } = await supabase
        .from('product_sub_items')
        .insert({
          parent_product_id: product.id,
          sub_product_id: data.sub_product_id,
          quantity: data.quantity
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-subitems', product?.id] });
      toast.success('Alt ürün eklendi');
      setSelectedProductId('');
      setQuantity('1');
    },
    onError: (error) => {
      toast.error('Alt ürün eklenirken hata oluştu: ' + error.message);
    },
  });

  const deleteSubItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_sub_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-subitems', product?.id] });
      toast.success('Alt ürün silindi');
    },
    onError: (error) => {
      toast.error('Alt ürün silinirken hata oluştu: ' + error.message);
    },
  });

  const handleAddSubItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error('Lütfen bir ürün seçin');
      return;
    }
    addSubItemMutation.mutate({
      sub_product_id: selectedProductId,
      quantity: parseInt(quantity)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Alt Ürün Yönetimi - {product?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <form onSubmit={handleAddSubItem} className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="product">Ürün Seç</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Ürün seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} - {p.unit_price} {p.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-24">
              <Label htmlFor="quantity">Miktar</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            
            <Button type="submit" disabled={addSubItemMutation.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Ekle
            </Button>
          </form>

          <div>
            <h3 className="text-lg font-medium mb-4">Alt Ürünler</h3>
            {isLoading ? (
              <div className="text-center py-4">Yükleniyor...</div>
            ) : subItems?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Henüz alt ürün eklenmemiş
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün Adı</TableHead>
                    <TableHead>Miktar</TableHead>
                    <TableHead>Birim Fiyat</TableHead>
                    <TableHead>Toplam</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.sub_product?.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        {item.sub_product?.unit_price} {item.sub_product?.currency}
                      </TableCell>
                      <TableCell>
                        {(item.sub_product?.unit_price * item.quantity).toFixed(2)} {item.sub_product?.currency}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSubItemMutation.mutate(item.id)}
                          disabled={deleteSubItemMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSubItemsModal;
