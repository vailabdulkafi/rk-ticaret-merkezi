
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { generateQuotationPdf } from './QuotationPdfGenerator';
import { toast } from 'sonner';

interface QuotationPdfSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: any;
  items: any[];
  company: any;
}

const QuotationPdfSettingsModal = ({ 
  open, 
  onOpenChange, 
  quotation, 
  items, 
  company 
}: QuotationPdfSettingsModalProps) => {
  const [settings, setSettings] = useState({
    showProductProperties: true,
    headerColor: '#428bca',
    fontSize: 12,
    showCompanyLogo: false,
    customFooterText: 'Bu teklif elektronik ortamda oluşturulmuştur. Resmi onay için yetkili imzası gereklidir.'
  });

  const handleGeneratePdf = async () => {
    try {
      await generateQuotationPdf({
        quotation,
        items,
        company,
        settings
      });
      
      toast.success('PDF başarıyla oluşturuldu');
      onOpenChange(false);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast.error('PDF oluşturulurken hata oluştu');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>PDF Ayarları</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.showProductProperties}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, showProductProperties: checked }))
              }
            />
            <Label>Ürün özelliklerini göster</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.showCompanyLogo}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, showCompanyLogo: checked }))
              }
            />
            <Label>Firma logosunu göster</Label>
          </div>

          <div>
            <Label htmlFor="headerColor">Başlık rengi</Label>
            <Input
              id="headerColor"
              type="color"
              value={settings.headerColor}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, headerColor: e.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="fontSize">Font boyutu</Label>
            <Input
              id="fontSize"
              type="number"
              min="8"
              max="16"
              value={settings.fontSize}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))
              }
            />
          </div>

          <div>
            <Label htmlFor="footerText">Alt bilgi metni</Label>
            <Textarea
              id="footerText"
              value={settings.customFooterText}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, customFooterText: e.target.value }))
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleGeneratePdf}>
            PDF Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationPdfSettingsModal;
