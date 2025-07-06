
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

const SettingsNavigation = () => {
  return (
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
      <TabsTrigger value="countries" className="w-full justify-start text-left">
        Ülkeler
      </TabsTrigger>
      <TabsTrigger value="companytypes" className="w-full justify-start text-left">
        Firma Tipleri
      </TabsTrigger>
      <TabsTrigger value="brands" className="w-full justify-start text-left">
        Markalar
      </TabsTrigger>
      <TabsTrigger value="currencies" className="w-full justify-start text-left">
        Para Birimleri
      </TabsTrigger>
      <TabsTrigger value="quotationstatus" className="w-full justify-start text-left">
        Teklif Durumları
      </TabsTrigger>
      <TabsTrigger value="theme" className="w-full justify-start text-left">
        Tema
      </TabsTrigger>
    </TabsList>
  );
};

export default SettingsNavigation;
