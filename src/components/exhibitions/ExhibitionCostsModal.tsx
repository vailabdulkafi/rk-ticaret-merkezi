
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface ExhibitionCostsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exhibition: any;
}

const ExhibitionCostsModal = ({ open, onOpenChange, exhibition }: ExhibitionCostsModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [costDate, setCostDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('general');

  const { data: costs } = useQuery({
    queryKey: ['exhibition-costs', exhibition?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exhibition_costs')
        .select('*')
        .eq('exhibition_id', exhibition.id)
        .order('cost_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!exhibition?.id && open,
  });

  const addCostMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('exhibition_costs')
        .insert({
          exhibition_id: exhibition.id,
          description: data.description,
          amount: parseFloat(data.amount),
          currency: data.currency,
          cost_date: data.costDate,
          category: data.category,
          created_by: user?.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibition-costs', exhibition?.id] });
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
      toast.success('Maliyet eklendi');
      setDescription('');
      setAmount('');
      setCategory('general');
    },
    onError: (error) => {
      toast.error('Maliyet eklenirken hata oluştu: ' + error.message);
    },
  });

  const deleteCostMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exhibition_costs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibition-costs', exhibition?.id] });
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
      toast.success('Maliyet silindi');
    },
    onError: (error) => {
      toast.error('Maliyet silinirken hata oluştu: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount.trim()) {
      toast.error('Açıklama ve tutar gereklidir');
      return;
    }

    addCostMutation.mutate({
      description,
      amount,
      currency,
      costDate,
      category
    });
  };

  const getTotalCost = () => {
    if (!costs) return 0;
    return costs.reduce((total, cost) => total + cost.amount, 0);
  };

  const getCategoryText = (cat: string) => {
    const categories = {
      general: 'Genel',
      booth: 'Stand',
      travel: 'Seyahat',
      accommodation: 'Konaklama',
      marketing: 'Pazarlama',
      other: 'Diğer'
    };
    return categories[cat as keyof typeof categories] || cat;
  };

  if (!exhibition) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fuar Maliyetleri - {exhibition.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
            <div className="col-span-2">
              <Label htmlFor="description">Açıklama</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Stand kira ücreti, seyahat masrafı..."
              />
            </div>

            <div>
              <Label htmlFor="amount">Tutar</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Para Birimi</Label>
              <Select value={currency} onValueChange={setCurrency}>
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
              <Label htmlFor="cost-date">Tarih</Label>
              <Input
                id="cost-date"
                type="date"
                value={costDate}
                onChange={(e) => setCostDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Genel</SelectItem>
                  <SelectItem value="booth">Stand</SelectItem>
                  <SelectItem value="travel">Seyahat</SelectItem>
                  <SelectItem value="accommodation">Konaklama</SelectItem>
                  <SelectItem value="marketing">Pazarlama</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 flex justify-end">
              <Button type="submit" disabled={addCostMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                {addCostMutation.isPending ? 'Ekleniyor...' : 'Maliyet Ekle'}
              </Button>
            </div>
          </form>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Maliyet Kayıtları</h3>
              <div className="text-lg font-semibold text-blue-600">
                <DollarSign className="inline h-5 w-5 mr-1" />
                Toplam: {getTotalCost().toLocaleString('tr-TR')} {currency}
              </div>
            </div>
            
            {costs && costs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell className="font-medium">{cost.description}</TableCell>
                      <TableCell>{getCategoryText(cost.category)}</TableCell>
                      <TableCell className="font-medium">
                        {cost.amount.toLocaleString('tr-TR')} {cost.currency}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(cost.cost_date).toLocaleDateString('tr-TR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCostMutation.mutate(cost.id)}
                          disabled={deleteCostMutation.isPending}
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
                Henüz maliyet kaydı eklenmemiş. Yukarıdaki formu kullanarak maliyet ekleyebilirsiniz.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExhibitionCostsModal;
