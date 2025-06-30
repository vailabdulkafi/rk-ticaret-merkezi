
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Palette } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [primaryColor, setPrimaryColor] = useState('#1f2937');
  const [secondaryColor, setSecondaryColor] = useState('#6b7280');

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
      if (primary) setPrimaryColor(JSON.parse(primary.value as string));
      if (secondary) setSecondaryColor(JSON.parse(secondary.value as string));
    }
  }, [themeSettings]);

  const updateThemeMutation = useMutation({
    mutationFn: async ({ name, value }: { name: string; value: string }) => {
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          setting_type: 'theme',
          name,
          value: JSON.stringify(value),
          language: 'TR',
          created_by: user?.id
        }, {
          onConflict: 'setting_type,name'
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

  const handleSaveTheme = () => {
    updateThemeMutation.mutate({ name: 'primary_color', value: primaryColor });
    updateThemeMutation.mutate({ name: 'secondary_color', value: secondaryColor });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600">Sistem ayarlarını buradan yönetebilirsiniz</p>
      </div>

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
              <Label htmlFor="primary-color">Ana Renk</Label>
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
              <Label htmlFor="secondary-color">İkinci Renk</Label>
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
    </div>
  );
};

export default Settings;
