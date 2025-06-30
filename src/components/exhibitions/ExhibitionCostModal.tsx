
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ExhibitionCostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exhibition: any;
}

const ExhibitionCostModal = ({ open, onOpenChange, exhibition }: ExhibitionCostModalProps) => {
  const queryClient = useQueryClient();
  const [targetCost, setTargetCost] = useState(exhibition?.target_cost?.toString() || '');
  const [actualCost, setActualCost] = useState(exhibition?.actual_cost?.toString() || '');
  const [currency, setCurrency] = useState(exhibition?.cost_currency || 'TRY');

  const updateCostMutation = useMutation({
    mutationFn: async (data: { target_cost: number; actual_cost: number; cost_currency: string }) => {
      const { error } = await supabase
        .from('exhibitions')
        .update(data)
        .eq('id', exhibition.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
      toast.success('Maliyet bilgileri güncellendi');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Maliyet güncellenirken hata oluştu: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCostMutation.mutate({
      target_cost: parseFloat(targetCost) || 0,
      actual_cost: parseFloat(actualCost) || 0,
      cost_currency: currency
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Maliyet Yönetimi - {exhibition?.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="target-cost">Hedef Maliyet</Label>
            <Input
              id="target-cost"
              type="number"
              step="0.01"
              value={targetCost}
              onChange={(e) => setTargetCost(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="actual-cost">Gerçekleşen Maliyet</Label>
            <Input
              id="actual-cost"
              type="number"
              step="0.01"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="currency">Para Birimi</Label>
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={updateCostMutation.isPending}>
              {updateCostMutation.isPending ? 'Güncelleniyor...' : 'Güncelle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExhibitionCostModal;
