
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Edit } from 'lucide-react';

interface ProductMatrixModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

const ProductMatrixModal = ({ open, onOpenChange, product }: ProductMatrixModalProps) => {
  const queryClient = useQueryClient();
  const [showMatrixForm, setShowMatrixForm] = useState(false);
  const [showValueForm, setShowValueForm] = useState(false);
  const [selectedMatrix, setSelectedMatrix] = useState<any>(null);
  const [matrixForm, setMatrixForm] = useState({
    name: '',
    parameter_count: 2,
    parameter_1_name: '',
    parameter_2_name: '',
    parameter_3_name: '',
    parameter_4_name: ''
  });
  const [valueForm, setValueForm] = useState({
    param_1_value: '',
    param_2_value: '',
    param_3_value: '',
    param_4_value: '',
    price: ''
  });

  const { data: matrices, isLoading } = useQuery({
    queryKey: ['product-matrices', product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_matrices')
        .select('*')
        .eq('product_id', product?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!product?.id && open,
  });

  const { data: matrixValues } = useQuery({
    queryKey: ['matrix-values', selectedMatrix?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matrix_values')
        .select('*')
        .eq('matrix_id', selectedMatrix?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedMatrix?.id,
  });

  const createMatrixMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('product_matrices')
        .insert({
          ...data,
          product_id: product.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-matrices', product?.id] });
      toast.success('Matris oluşturuldu');
      setShowMatrixForm(false);
      setMatrixForm({
        name: '',
        parameter_count: 2,
        parameter_1_name: '',
        parameter_2_name: '',
        parameter_3_name: '',
        parameter_4_name: ''
      });
    },
    onError: (error) => {
      toast.error('Matris oluşturulurken hata: ' + error.message);
    },
  });

  const createValueMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('matrix_values')
        .insert({
          ...data,
          matrix_id: selectedMatrix.id,
          price: parseFloat(data.price)
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-values', selectedMatrix?.id] });
      toast.success('Matris değeri eklendi');
      setShowValueForm(false);
      setValueForm({
        param_1_value: '',
        param_2_value: '',
        param_3_value: '',
        param_4_value: '',
        price: ''
      });
    },
    onError: (error) => {
      toast.error('Değer eklenirken hata: ' + error.message);
    },
  });

  const deleteMatrixMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_matrices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-matrices', product?.id] });
      toast.success('Matris silindi');
      setSelectedMatrix(null);
    },
    onError: (error) => {
      toast.error('Matris silinirken hata: ' + error.message);
    },
  });

  const deleteValueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('matrix_values')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-values', selectedMatrix?.id] });
      toast.success('Değer silindi');
    },
    onError: (error) => {
      toast.error('Değer silinirken hata: ' + error.message);
    },
  });

  const handleCreateMatrix = (e: React.FormEvent) => {
    e.preventDefault();
    createMatrixMutation.mutate(matrixForm);
  };

  const handleCreateValue = (e: React.FormEvent) => {
    e.preventDefault();
    createValueMutation.mutate(valueForm);
  };

  const renderParameterInputs = (count: number) => {
    const inputs = [];
    for (let i = 1; i <= count; i++) {
      inputs.push(
        <div key={i}>
          <Label htmlFor={`param_${i}`}>Parametre {i} Adı</Label>
          <Input
            id={`param_${i}`}
            value={matrixForm[`parameter_${i}_name` as keyof typeof matrixForm]}
            onChange={(e) => setMatrixForm(prev => ({ 
              ...prev, 
              [`parameter_${i}_name`]: e.target.value 
            }))}
            required
          />
        </div>
      );
    }
    return inputs;
  };

  const renderValueInputs = (matrix: any) => {
    const inputs = [];
    for (let i = 1; i <= matrix.parameter_count; i++) {
      inputs.push(
        <div key={i}>
          <Label htmlFor={`value_${i}`}>{matrix[`parameter_${i}_name`]}</Label>
          <Input
            id={`value_${i}`}
            value={valueForm[`param_${i}_value` as keyof typeof valueForm]}
            onChange={(e) => setValueForm(prev => ({ 
              ...prev, 
              [`param_${i}_value`]: e.target.value 
            }))}
            required
          />
        </div>
      );
    }
    return inputs;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ürün Matrisleri - {product?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Matrisler</CardTitle>
                <Button onClick={() => setShowMatrixForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Matris
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Yükleniyor...</div>
              ) : matrices?.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Henüz matris eklenmemiş
                </div>
              ) : (
                <div className="space-y-2">
                  {matrices?.map((matrix) => (
                    <div
                      key={matrix.id}
                      className={`p-3 border rounded cursor-pointer ${
                        selectedMatrix?.id === matrix.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedMatrix(matrix)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{matrix.name}</div>
                          <div className="text-sm text-gray-500">
                            {matrix.parameter_count} parametre
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMatrixMutation.mutate(matrix.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showMatrixForm && (
                <form onSubmit={handleCreateMatrix} className="mt-4 space-y-4 border-t pt-4">
                  <div>
                    <Label htmlFor="matrix_name">Matris Adı</Label>
                    <Input
                      id="matrix_name"
                      value={matrixForm.name}
                      onChange={(e) => setMatrixForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="param_count">Parametre Sayısı</Label>
                    <Select
                      value={matrixForm.parameter_count.toString()}
                      onValueChange={(value) => setMatrixForm(prev => ({ 
                        ...prev, 
                        parameter_count: parseInt(value) 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {renderParameterInputs(matrixForm.parameter_count)}

                  <div className="flex gap-2">
                    <Button type="submit" disabled={createMatrixMutation.isPending}>
                      Matris Oluştur
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowMatrixForm(false)}
                    >
                      İptal
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {selectedMatrix ? `${selectedMatrix.name} - Değerler` : 'Matris Seçin'}
                </CardTitle>
                {selectedMatrix && (
                  <Button onClick={() => setShowValueForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Değer Ekle
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedMatrix ? (
                <div className="text-center py-8 text-gray-500">
                  Değerleri görmek için bir matris seçin
                </div>
              ) : (
                <>
                  {matrixValues?.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Bu matris için henüz değer eklenmemiş
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Array.from({ length: selectedMatrix.parameter_count }, (_, i) => (
                            <TableHead key={i}>
                              {selectedMatrix[`parameter_${i + 1}_name`]}
                            </TableHead>
                          ))}
                          <TableHead>Fiyat</TableHead>
                          <TableHead>İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matrixValues?.map((value) => (
                          <TableRow key={value.id}>
                            {Array.from({ length: selectedMatrix.parameter_count }, (_, i) => (
                              <TableCell key={i}>
                                {value[`param_${i + 1}_value`]}
                              </TableCell>
                            ))}
                            <TableCell>{value.price}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteValueMutation.mutate(value.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {showValueForm && (
                    <form onSubmit={handleCreateValue} className="mt-4 space-y-4 border-t pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        {renderValueInputs(selectedMatrix)}
                        <div>
                          <Label htmlFor="price">Fiyat</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={valueForm.price}
                            onChange={(e) => setValueForm(prev => ({ ...prev, price: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={createValueMutation.isPending}>
                          Değer Ekle
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowValueForm(false)}
                        >
                          İptal
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductMatrixModal;
