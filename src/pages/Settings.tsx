
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import CompanyInfoSettings from '@/components/settings/CompanyInfoSettings';
import BankInfoSettings from '@/components/settings/BankInfoSettings';
import PaymentMethodsSettings from '@/components/settings/PaymentMethodsSettings';
import DeliveryMethodsSettings from '@/components/settings/DeliveryMethodsSettings';
import DictionarySettings from '@/components/settings/DictionarySettings';
import QuotationParametersSettings from '@/components/settings/QuotationParametersSettings';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Palette } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');

  const { data: themeSettings, isLoading } = useQuery({
    queryKey: ['theme-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('setting_type', 'theme');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (themeSettings) {
      const primary = themeSettings.find(s => s.name === 'primary_color');
      const secondary = themeSettings.find(s => s.name === 'secondary_color');
      
      if (primary?.value) {
        const primaryValue = typeof primary.value === 'string' ? primary.value : JSON.stringify(primary.value).replace(/"/g, '');
        setPrimaryColor(primaryValue);
      }
      if (secondary?.value) {
        const secondaryValue = typeof secondary.value === 'string' ? secondary.value : JSON.stringify(secondary.value).replace(/"/g, '');
        setSecondaryColor(secondaryValue);
      }
    }
  }, [themeSettings]);

  // Apply theme colors to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--secondary', secondaryColor);
  }, [primaryColor, secondaryColor]);

  const updateThemeMutation = useMutation({
    mutationFn: async ({ name, value }: { name: string; value: string }) => {
      // Delete existing settings with the same name to avoid conflicts
      await supabase
        .from('company_settings')
        .delete()
        .eq('setting_type', 'theme')
        .eq('name', name);

      // Insert new setting
      const { error } = await supabase
        .from('company_settings')
        .insert({
          setting_type: 'theme',
          name,
          value: value,
          language: 'TR',
          created_by: user?.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-settings'] });
      toast.success('Tema ayarları güncellendi');
    },
    onError: (error) => {
      toast.error('Tema ayarları güncellenirken hata oluştu: ' + error.message);
    },
  });

  const handleSaveTheme = async () => {
    try {
      await updateThemeMutation.mutateAsync({ name: 'primary_color', value: primaryColor });
      await updateThemeMutation.mutateAsync({ name: 'secondary_color', value: secondaryColor });
      
      // Apply the colors immediately to the CSS
      const root = document.documentElement;
      root.style.setProperty('--primary', primaryColor);
      root.style.setProperty('--secondary', secondaryColor);
    } catch (error) {
      console.error('Tema kaydetme hatası:', error);
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600">Ayarlara erişmek için giriş yapmanız gerekiyor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600">Sistem ayarlarını buradan yönetebilirsiniz</p>
      </div>

      <Tabs defaultValue="company" className="w-full" orientation="vertical">
        <div className="flex flex-col lg:flex-row gap-6">
          <TabsList className="flex flex-col h-auto w-full lg:w-64 bg-gray-50 p-2">
            <TabsTrigger value="company" className="w-full justify-start text-left">
              Firma Bilgileri
            </TabsTrigger>
            <TabsTrigger value="bank" className="w-full justify-start text-left">
              Banka Bilgileri
            </TabsTrigger>
            <TabsTrigger value="payment" className="w-full justify-start text-left">
              Ödeme Şekilleri
            </TabsTrigger>
            <TabsTrigger value="delivery" className="w-full justify-start text-left">
              Teslim Şekilleri
            </TabsTrigger>
            <TabsTrigger value="parameters" className="w-full justify-start text-left">
              Teklif Parametreleri
            </TabsTrigger>
            <TabsTrigger value="dictionary" className="w-full justify-start text-left">
              Sözlük
            </TabsTrigger>
            <TabsTrigger value="theme" className="w-full justify-start text-left">
              Tema
            </TabsTrigger>
          </TabsList>

          <div className="flex-1">
            <TabsContent value="company" className="mt-0">
              <CompanyInfoSettings />
            </TabsContent>

            <TabsContent value="bank" className="mt-0">
              <BankInfoSettings />
            </TabsContent>

            <TabsContent value="payment" className="mt-0">
              <PaymentMethodsSettings />
            </TabsContent>

            <TabsContent value="delivery" className="mt-0">
              <DeliveryMethodsSettings />
            </TabsContent>

            <TabsContent value="parameters" className="mt-0">
              <QuotationParametersSettings />
            </TabsContent>

            <TabsContent value="dictionary" className="mt-0">
              <DictionarySettings />
            </TabsContent>

            <TabsContent value="theme" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Tema Renkleri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primary-color">Ana Renk (Mavi)</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="primary-color"
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="secondary-color">İkinci Renk (Beyaz)</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="secondary-color"
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <div 
                      className="w-16 h-16 rounded-lg border-2"
                      style={{ backgroundColor: primaryColor }}
                      title="Ana Renk Önizleme"
                    />
                    <div 
                      className="w-16 h-16 rounded-lg border-2"
                      style={{ backgroundColor: secondaryColor }}
                      title="İkinci Renk Önizleme"
                    />
                  </div>

                  <Button 
                    onClick={handleSaveTheme}
                    disabled={updateThemeMutation.isPending}
                  >
                    {updateThemeMutation.isPending ? 'Kaydediliyor...' : 'Tema Ayarlarını Kaydet'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default Settings;
