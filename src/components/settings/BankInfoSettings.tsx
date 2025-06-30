
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CreditCard, Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface BankInfo {
  id: string;
  bank_name: string;
  branch_name: string | null;
  account_number: string;
  iban: string | null;
  swift_code: string | null;
  account_holder: string | null;
  currency: string | null;
  is_default: boolean | null;
}

const BankInfoSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankInfo | null>(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    branch_name: '',
    account_number: '',
    iban: '',
    swift_code: '',
    account_holder: '',
    currency: 'TRY',
    is_default: false
  });

  const { data: banks, isLoading } = useQuery({
    queryKey: ['bank-info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_info')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BankInfo[];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingBank) {
        const { error } = await supabase
          .from('bank_info')
          .update(data)
          .eq('id', editingBank.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('bank_info')
          .insert({ ...data, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-info'] });
      toast.success(editingBank ? 'Banka bilgisi güncellendi' : 'Banka bilgisi eklendi');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Hata: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bank_info')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-info'] });
      toast.success('Banka bilgisi silindi');
    },
    onError: (error) => {
      toast.error('Hata: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      bank_name: '',
      branch_name: '',
      account_number: '',
      iban: '',
      swift_code: '',
      account_holder: '',
      currency: 'TRY',
      is_default: false
    });
    setEditingBank(null);
  };

  const handleEdit = (bank: BankInfo) => {
    setEditingBank(bank);
    setFormData({
      bank_name: bank.bank_name,
      branch_name: bank.branch_name || '',
      account_number: bank.account_number,
      iban: bank.iban || '',
      swift_code: bank.swift_code || '',
      account_holder: bank.account_holder || '',
      currency: bank.currency || 'TRY',
      is_default: bank.is_default || false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Banka Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Banka Bilgileri
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Banka
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingBank ? 'Banka Bilgisini Düzenle' : 'Yeni Banka Bilgisi'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bank_name">Banka Adı *</Label>
                    <Input
                      id="bank_name"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="branch_name">Şube Adı</Label>
                    <Input
                      id="branch_name"
                      value={formData.branch_name}
                      onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="account_number">Hesap Numarası *</Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="swift_code">SWIFT Kodu</Label>
                    <Input
                      id="swift_code"
                      value={formData.swift_code}
                      onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="account_holder">Hesap Sahibi</Label>
                    <Input
                      id="account_holder"
                      value={formData.account_holder}
                      onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="currency">Para Birimi</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">TRY - Türk Lirası</SelectItem>
                      <SelectItem value="USD">USD - Amerikan Doları</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <Label htmlFor="is_default">Varsayılan banka</Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    İptal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {banks?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Henüz banka bilgisi eklenmemiş.</p>
        ) : (
          <div className="space-y-4">
            {banks?.map((bank) => (
              <div key={bank.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{bank.bank_name}</h3>
                    {bank.is_default && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Varsayılan
                      </span>
                    )}
                    {bank.branch_name && <p className="text-gray-600 mt-1">Şube: {bank.branch_name}</p>}
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span>Hesap: {bank.account_number}</span>
                      {bank.currency && <span>Para Birimi: {bank.currency}</span>}
                    </div>
                    {bank.iban && <p className="text-sm text-gray-600 mt-1">IBAN: {bank.iban}</p>}
                    <div className="flex gap-4 mt-1 text-sm text-gray-600">
                      {bank.swift_code && <span>SWIFT: {bank.swift_code}</span>}
                      {bank.account_holder && <span>Hesap Sahibi: {bank.account_holder}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(bank)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(bank.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BankInfoSettings;
