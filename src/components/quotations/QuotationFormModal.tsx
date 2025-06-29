
import { useState } from 'react';
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

interface QuotationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuotationFormData {
  title: string;
  company_id: string;
  quotation_number: string;
  valid_until: string;
  currency: string;
  notes: string;
}

const QuotationFormModal = ({ open, onOpenChange }: QuotationFormModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<QuotationFormData>({
    title: '',
    company_id: '',
    quotation_number: '',
    valid_until: '',
    currency: 'TRY',
    notes: ''
  });

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

  const createMutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı');
      
      const { error } = await supabase
        .from('quotations')
        .insert({
          ...data,
          valid_until: data.valid_until || null,
          created_by: user.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Teklif başarıyla eklendi');
      onOpenChange(false);
      setFormData({
        title: '',
        company_id: '',
        quotation_number: '',
        valid_until: '',
        currency: 'TRY',
        notes: ''
      });
    },
    onError: (error) => {
      toast.error('Teklif eklenirken hata oluştu: ' + error.message);
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
    createMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof QuotationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Auto-generate quotation number
  const generateQuotationNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const quotationNumber = `TKL-${year}${month}${day}-${random}`;
    handleInputChange('quotation_number', quotationNumber);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Yeni Teklif Oluştur</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div>
            <Label htmlFor="valid_until">Geçerlilik Tarihi</Label>
            <Input
              id="valid_until"
              type="date"
              value={formData.valid_until}
              onChange={(e) => handleInputChange('valid_until', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
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
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Oluşturuluyor...' : 'Teklif Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationFormModal;
