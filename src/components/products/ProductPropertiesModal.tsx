
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Languages } from 'lucide-react';
import { toast } from 'sonner';

interface ProductPropertiesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

const ProductPropertiesModal = ({ open, onOpenChange, product }: ProductPropertiesModalProps) => {
  const queryClient = useQueryClient();
  const [propertyName, setPropertyName] = useState('');
  const [propertyValue, setPropertyValue] = useState('');
  const [language, setLanguage] = useState<'TR' | 'EN' | 'PL' | 'FR' | 'RU' | 'DE' | 'AR'>('TR');
  const [showInQuotation, setShowInQuotation] = useState(true);
  const [displayOrder, setDisplayOrder] = useState('0');

  const { data: properties } = useQuery({
    queryKey: ['product-properties', product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_properties')
        .select('*')
        .eq('product_id', product.id)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!product?.id && open,
  });

  const addPropertyMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('product_properties')
        .insert({
          product_id: product.id,
          property_name: data.propertyName,
          property_value: data.propertyValue,
          language: data.language,
          show_in_quotation: data.showInQuotation,
          display_order: parseInt(data.displayOrder)
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-properties', product?.id] });
      toast.success('Özellik eklendi');
      setPropertyName('');
      setPropertyValue('');
      setDisplayOrder('0');
    },
    onError: (error) => {
      toast.error('Özellik eklenirken hata oluştu: ' + error.message);
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_properties')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-properties', product?.id] });
      toast.success('Özellik silindi');
    },
    onError: (error) => {
      toast.error('Özellik silinirken hata oluştu: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyName.trim() || !propertyValue.trim()) {
      toast.error('Özellik adı ve değeri gereklidir');
      return;
    }

    addPropertyMutation.mutate({
      propertyName,
      propertyValue,
      language,
      showInQuotation,
      displayOrder
    });
  };

  const getLanguageText = (lang: string) => {
    const languages = {
      TR: 'Türkçe',
      EN: 'İngilizce',
      PL: 'Lehçe',
      FR: 'Fransızca',
      RU: 'Rusça',
      DE: 'Almanca',
      AR: 'Arapça'
    };
    return languages[lang as keyof typeof languages] || lang;
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ürün Özellikleri - {product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="property-name">Özellik Adı</Label>
              <Input
                id="property-name"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="Boyut, Renk, Malzeme..."
              />
            </div>

            <div>
              <Label htmlFor="property-value">Özellik Değeri</Label>
              <Input
                id="property-value"
                value={propertyValue}
                onChange={(e) => setPropertyValue(e.target.value)}
                placeholder="30x40 cm, Mavi, Çelik..."
              />
            </div>

            <div>
              <Label>Dil</Label>
              <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
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
              <Label htmlFor="display-order">Sıralama</Label>
              <Input
                id="display-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={showInQuotation}
                onCheckedChange={setShowInQuotation}
              />
              <Label>Teklifte Göster</Label>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={addPropertyMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                {addPropertyMutation.isPending ? 'Ekleniyor...' : 'Özellik Ekle'}
              </Button>
            </div>
          </form>

          <div>
            <h3 className="text-lg font-medium mb-4">Mevcut Özellikler</h3>
            {properties && properties.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Özellik Adı</TableHead>
                    <TableHead>Değer</TableHead>
                    <TableHead>Dil</TableHead>
                    <TableHead>Sıra</TableHead>
                    <TableHead>Teklifte</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{property.property_name}</TableCell>
                      <TableCell>{property.property_value}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Languages className="h-4 w-4 text-gray-400" />
                          {getLanguageText(property.language)}
                        </div>
                      </TableCell>
                      <TableCell>{property.display_order}</TableCell>
                      <TableCell>
                        {property.show_in_quotation ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePropertyMutation.mutate(property.id)}
                          disabled={deletePropertyMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Henüz özellik eklenmemiş. Yukarıdaki formu kullanarak özellik ekleyebilirsiniz.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductPropertiesModal;
