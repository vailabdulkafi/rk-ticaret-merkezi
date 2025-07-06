
import { TabsContent } from '@/components/ui/tabs';
import CompanyInfoSettings from './CompanyInfoSettings';
import BankInfoSettings from './BankInfoSettings';
import PaymentMethodsSettings from './PaymentMethodsSettings';
import DeliveryMethodsSettings from './DeliveryMethodsSettings';
import DictionarySettings from './DictionarySettings';
import QuotationParametersSettings from './QuotationParametersSettings';
import CountriesSettings from './CountriesSettings';
import CompanyTypesSettings from './CompanyTypesSettings';
import BrandsSettings from './BrandsSettings';
import CurrenciesSettings from './CurrenciesSettings';
import QuotationStatusesSettings from './QuotationStatusesSettings';
import ThemeSettings from './ThemeSettings';

const SettingsContent = () => {
  return (
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

      <TabsContent value="countries" className="mt-0">
        <CountriesSettings />
      </TabsContent>

      <TabsContent value="companytypes" className="mt-0">
        <CompanyTypesSettings />
      </TabsContent>

      <TabsContent value="brands" className="mt-0">
        <BrandsSettings />
      </TabsContent>

      <TabsContent value="currencies" className="mt-0">
        <CurrenciesSettings />
      </TabsContent>

      <TabsContent value="quotationstatus" className="mt-0">
        <QuotationStatusesSettings />
      </TabsContent>

      <TabsContent value="theme" className="mt-0">
        <ThemeSettings />
      </TabsContent>
    </div>
  );
};

export default SettingsContent;
