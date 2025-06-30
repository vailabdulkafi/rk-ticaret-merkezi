
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

interface QuotationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation?: any;
}

interface QuotationFormData {
  title: string;
  quotation_number: string;
  company_id: string;
  quotation_date: string;
  valid_until: string;
  currency: string;
  status: string;
  language: string;
  notes: string;
}

const QuotationFormModal = ({ open, onOpenChange, quotation }: QuotationFormModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<QuotationFormData>({
    title: '',
    quotation_number: '',
    company_id: '',
    quotation_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    currency: 'TRY',
    status: 'draft',
    language: 'TR',
    notes: ''
  });

  useEffect(() => {
    if (quotation) {
      setFormData({
        title: quotation.title || '',
        quotation_number: quotation.quotation_number || '',
        company_id: quotation.company_id || '',
        quotation_date: quotation.quotation_date || new Date().toISOString().split('T')[0],
        valid_until: quotation.valid_until || '',
        currency: quotation.currency || 'TRY',
        status: quotation.status || 'draft',
        language: quotation.language || 'TR',
        notes: quotation.notes || ''
      });
    } else {
      setFormData({
        title: '',
        quotation_number: `TEK-${Date.now()}`,
        company_id: '',
        quotation_date: new Date().toISOString().split('T')[0],
        valid_until: '',
        currency: 'TRY',
        status: 'draft',
        language: 'TR',
        notes: ''
      });
    }
  }, [quotation, open]);

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
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
          total_amount: 0,
          prepared_by: user.id,
          created_by: user.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Teklif başarıyla eklendi');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Teklif eklenirken hata oluştu: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      if (!quotation?.id) throw new Error('Teklif ID bulunamadı');
      
      const { error } = await supabase
        .from('quotations')
        .update(data)
        .eq('id', quotation.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Teklif başarıyla güncellendi');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Teklif güncellenirken hata oluştu: ' + error.message);
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
    
    if (quotation) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof QuotationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{quotation ? 'Teklif Güncelle' : 'Yeni Teklif Oluştur'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="quotation_number">Teklif Numarası</Label>
              <Input
                id="quotation_number"
                value={formData.quotation_number}
                onChange={(e) => handleInputChange('quotation_number', e.target.value)}
                required
              />
            </div>
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
              <Label htmlFor="quotation_date">Teklif Tarihi</Label>
              <Input
                id="quotation_date"
                type="date"
                value={formData.quotation_date}
                onChange={(e) => handleInputChange('quotation_date', e.target.value)}
              />
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
          </div>

          <div className="grid grid-cols-3 gap-4">
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
              <Label htmlFor="language">Dil</Label>
              <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TR">Türkçe</SelectItem>
                  <SelectItem value="EN">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Durum</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Taslak</SelectItem>
                  <SelectItem value="sent">Gönderildi</SelectItem>
                  <SelectItem value="accepted">Kabul Edildi</SelectItem>
                  <SelectItem value="rejected">Reddedildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              disabled={isLoading}
            >
              {isLoading ? (quotation ? 'Güncelleniyor...' : 'Oluşturuluyor...') : (quotation ? 'Teklif Güncelle' : 'Teklif Oluştur')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationFormModal;
