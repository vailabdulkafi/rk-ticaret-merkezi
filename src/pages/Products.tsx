
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Package, Settings, List } from 'lucide-react';
import { toast } from 'sonner';
import ProductFormModal from '@/components/products/ProductFormModal';
import ProductSubItemsModal from '@/components/products/ProductSubItemsModal';
import ProductMatrixModal from '@/components/products/ProductMatrixModal';
import ProductPropertiesModal from '@/components/products/ProductPropertiesModal';

const Products = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showSubItemsModal, setShowSubItemsModal] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Ürün başarıyla silindi');
    },
    onError: (error) => {
      toast.error('Ürün silinirken hata oluştu: ' + error.message);
    },
  });

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingProduct(null);
  };

  const handleSubItemsClick = (product: any) => {
    setSelectedProduct(product);
    setShowSubItemsModal(true);
  };

  const handleMatrixClick = (product: any) => {
    setSelectedProduct(product);
    setShowMatrixModal(true);
  };

  const handlePropertiesClick = (product: any) => {
    setSelectedProduct(product);
    setShowPropertiesModal(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-gray-600">Ürün katalogunu yönetin</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setShowFormModal(true)}
        >
          <Plus className="h-4 w-4" />
          Yeni Ürün
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Ürün ara..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredProducts.length} ürün bulundu
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün Adı</TableHead>
                <TableHead>Marka</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Birim Fiyat</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      {product.name}
                    </div>
                  </TableCell>
                  <TableCell>{product.brand || '-'}</TableCell>
                  <TableCell>{product.model || '-'}</TableCell>
                  <TableCell>{product.category?.name || '-'}</TableCell>
                  <TableCell>
                    {product.unit_price} {product.currency}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
                      {product.stock_quantity} {product.unit}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.stock_quantity > 0 ? "default" : "secondary"}>
                      {product.stock_quantity > 0 ? 'Stokta' : 'Tükendi'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handlePropertiesClick(product)}
                        title="Özellikler"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleMatrixClick(product)}
                        title="Matrisler"
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSubItemsClick(product)}
                        title="Alt Ürünler"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditClick(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteMutation.mutate(product.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ürün bulunamadı</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Arama kriterlerinize uygun ürün bulunamadı.' : 'Henüz ürün eklenmemiş.'}
          </p>
          <Button onClick={() => setShowFormModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            İlk ürünü ekle
          </Button>
        </div>
      )}

      <ProductFormModal 
        open={showFormModal}
        onOpenChange={handleCloseFormModal}
        product={editingProduct}
      />
      
      <ProductSubItemsModal
        open={showSubItemsModal}
        onOpenChange={setShowSubItemsModal}
        product={selectedProduct}
      />

      <ProductMatrixModal
        open={showMatrixModal}
        onOpenChange={setShowMatrixModal}
        product={selectedProduct}
      />

      <ProductPropertiesModal
        open={showPropertiesModal}
        onOpenChange={setShowPropertiesModal}
        product={selectedProduct}
      />
    </div>
  );
};

export default Products;
