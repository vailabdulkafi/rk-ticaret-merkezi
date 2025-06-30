
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Building2, CreditCard, Truck, Users, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface QuotationSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId?: string;
}

const QuotationSettingsModal = ({ open, onOpenChange, quotationId }: QuotationSettingsModalProps) => {
  const queryClient = useQueryClient();
  const [companyInfoId, setCompanyInfoId] = useState('');
  const [bankInfoId, setBankInfoId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [deliveryMethodId, setDeliveryMethodId] = useState('');
  const [customerResponsibilities, setCustomerResponsibilities] = useState('');
  const [supplierResponsibilities, setSupplierResponsibilities] = useState('');

  // Fetch company info options
  const { data: companyInfos } = useQuery({
    queryKey: ['company-infos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch bank info options
  const { data: bankInfos } = useQuery({
    queryKey: ['bank-infos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_info')
        .select('*')
        .order('bank_name');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch payment methods
  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch delivery methods
  const { data: deliveryMethods } = useQuery({
    queryKey: ['delivery-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_methods')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch existing settings if editing
  const { data: existingSettings } = useQuery({
    queryKey: ['quotation-settings', quotationId],
    queryFn: async () => {
      if (!quotationId) return null;
      
      const { data, error } = await supabase
        .from('quotation_settings')
        .select('*')
        .eq('quotation_id', quotationId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!quotationId && open,
  });

  // Fetch existing responsibilities
  const { data: existingResponsibilities } = useQuery({
    queryKey: ['quotation-responsibilities', quotationId],
    queryFn: async () => {
      if (!quotationId) return [];
      
      const { data, error } = await supabase
        .from('quotation_responsibilities')
        .select('*')
        .eq('quotation_id', quotationId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!quotationId && open,
  });

  useEffect(() => {
    if (existingSettings) {
      setCompanyInfoId(existingSettings.company_info_id || '');
      setBankInfoId(existingSettings.bank_info_id || '');
      setPaymentMethodId(existingSettings.payment_method_id || '');
      setDeliveryMethodId(existingSettings.delivery_method_id || '');
    }
  }, [existingSettings]);

  useEffect(() => {
    if (existingResponsibilities) {
      const customer = existingResponsibilities.find(r => r.responsibility_type === 'customer');
      const supplier = existingResponsibilities.find(r => r.responsibility_type === 'supplier');
      setCustomerResponsibilities(customer?.description || '');
      setSupplierResponsibilities(supplier?.description || '');
    }
  }, [existingResponsibilities]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!quotationId) throw new Error('Quotation ID gerekli');

      // Save quotation settings
      const { error: settingsError } = await supabase
        .from('quotation_settings')
        .upsert({
          quotation_id: quotationId,
          company_info_id: data.companyInfoId || null,
          bank_info_id: data.bankInfoId || null,
          payment_method_id: data.paymentMethodId || null,
          delivery_method_id: data.deliveryMethodId || null,
        });

      if (settingsError) throw settingsError;

      // Delete existing responsibilities
      await supabase
        .from('quotation_responsibilities')
        .delete()
        .eq('quotation_id', quotationId);

      // Insert new responsibilities
      const responsibilities = [];
      if (data.customerResponsibilities.trim()) {
        responsibilities.push({
          quotation_id: quotationId,
          responsibility_type: 'customer',
          responsible_party: 'Müşteri',
          description: data.customerResponsibilities.trim()
        });
      }
      if (data.supplierResponsibilities.trim()) {
        responsibilities.push({
          quotation_id: quotationId,
          responsibility_type: 'supplier',
          responsible_party: 'Tedarikçi',
          description: data.supplierResponsibilities.trim()
        });
      }

      if (responsibilities.length > 0) {
        const { error: responsibilitiesError } = await supabase
          .from('quotation_responsibilities')
          .insert(responsibilities);

        if (responsibilitiesError) throw responsibilitiesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation-settings'] });
      queryClient.invalidateQueries({ queryKey: ['quotation-responsibilities'] });
      toast.success('Teklif ayarları kaydedildi');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Ayarlar kaydedilirken hata oluştu: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate({
      companyInfoId,
      bankInfoId,
      paymentMethodId,
      deliveryMethodId,
      customerResponsibilities,
      supplierResponsibilities
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Teklif Ayarları</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium">Firma Bilgileri</h3>
            </div>
            <div>
              <Label>Gönderen Firma</Label>
              <Select value={companyInfoId} onValueChange={setCompanyInfoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Firma seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {companyInfos?.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              <h3 className="font-medium">Ödeme Bilgileri</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ödeme Şekli</Label>
                <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ödeme şekli seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods?.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Banka Bilgisi</Label>
                <Select value={bankInfoId} onValueChange={setBankInfoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Banka seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bankInfos?.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.bank_name} - {bank.account_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              <h3 className="font-medium">Teslimat Bilgileri</h3>
            </div>
            <div>
              <Label>Teslimat Şartı</Label>
              <Select value={deliveryMethodId} onValueChange={setDeliveryMethodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Teslimat şartı seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {deliveryMethods?.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <h3 className="font-medium">Sorumluluklar</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer-responsibilities">Müşteri Sorumlulukları</Label>
                <Textarea
                  id="customer-responsibilities"
                  value={customerResponsibilities}
                  onChange={(e) => setCustomerResponsibilities(e.target.value)}
                  placeholder="Müşterinin yerine getirmesi gereken sorumluluklar..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="supplier-responsibilities">Tedarikçi Sorumlulukları</Label>
                <Textarea
                  id="supplier-responsibilities"
                  value={supplierResponsibilities}
                  onChange={(e) => setSupplierResponsibilities(e.target.value)}
                  placeholder="Tedarikçinin yerine getirmesi gereken sorumluluklar..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={saveSettingsMutation.isPending}>
              {saveSettingsMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationSettingsModal;
