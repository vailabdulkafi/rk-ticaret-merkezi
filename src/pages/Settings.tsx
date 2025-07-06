
import { Tabs } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import SettingsNavigation from '@/components/settings/SettingsNavigation';
import SettingsContent from '@/components/settings/SettingsContent';

const Settings = () => {
  const { user } = useAuth();

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
          <p className="text-gray-600">Sistem ayarlarını buradan yönetebilirsiniz</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Yeni Ayar Ekle
        </Button>
      </div>

      <Tabs defaultValue="company" className="w-full" orientation="vertical">
        <div className="flex flex-col lg:flex-row gap-6">
          <SettingsNavigation />
          <SettingsContent />
        </div>
      </Tabs>
    </div>
  );
};

export default Settings;
