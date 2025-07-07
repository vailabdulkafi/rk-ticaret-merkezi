
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Türkçe karakter desteği için font ekleme
declare module 'jspdf' {
  interface jsPDF {
    addFont(postScriptName: string, id: string, fontStyle: string): string;
  }
}

interface QuotationPdfData {
  quotation: any;
  items: any[];
  company: any;
  settings?: {
    showProductProperties?: boolean;
    headerColor?: string;
    fontSize?: number;
    showCompanyLogo?: boolean;
    customFooterText?: string;
  };
}

export const generateQuotationPdf = async (data: QuotationPdfData) => {
  const { quotation, items, company, settings = {} } = data;
  
  const doc = new jsPDF();
  
  // Türkçe karakter desteği için encoding ayarlama
  doc.setLanguage('tr');
  
  const defaultSettings = {
    showProductProperties: true,
    headerColor: '#428bca',
    fontSize: 12,
    showCompanyLogo: false,
    customFooterText: 'Bu teklif elektronik ortamda oluşturulmuştur. Resmi onay için yetkili imzası gereklidir.',
    ...settings
  };

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FİYAT TEKLİFİ', 105, 20, { align: 'center' });
  
  // Quotation Info Section
  doc.setFontSize(defaultSettings.fontSize);
  doc.setFont('helvetica', 'normal');
  doc.text(`Teklif No: ${quotation.quotation_number}`, 20, 40);
  doc.text(`Tarih: ${new Date(quotation.quotation_date).toLocaleDateString('tr-TR')}`, 20, 50);
  doc.text(`Geçerlilik: ${quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('tr-TR') : '-'}`, 20, 60);
  
  // Company Info Section
  doc.text(`Firma: ${company?.name || '-'}`, 120, 40);
  doc.text(`İletişim: ${company?.contact_person || '-'}`, 120, 50);
  doc.text(`Telefon: ${company?.phone || '-'}`, 120, 60);
  doc.text(`E-posta: ${company?.email || '-'}`, 120, 70);
  
  // Line separator
  doc.line(20, 80, 190, 80);
  
  let currentY = 90;
  
  // Ana ürünler tablosu
  const mainTableData = items
    .filter(item => !item.is_sub_item)
    .map(item => [
      item.products?.name || '-',
      item.products?.brand || '-',
      item.products?.model || '-',
      item.quantity.toString(),
      formatPrice(item.unit_price, quotation.currency),
      item.discount_percentage ? `${item.discount_percentage}%` : '0%',
      formatPrice(item.total_price, quotation.currency)
    ]);
  
  autoTable(doc, {
    head: [['Ürün Adı', 'Marka', 'Model', 'Miktar', 'Birim Fiyat', 'İndirim', 'Toplam']],
    body: mainTableData,
    startY: currentY,
    styles: {
      fontSize: 10,
      cellPadding: 4,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: hexToRgb(defaultSettings.headerColor),
      textColor: 255,
      fontSize: 11,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 },
      5: { cellWidth: 20 },
      6: { cellWidth: 35 },
    },
    margin: { left: 20, right: 20 },
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 15;
  
  // Ürün özellikleri tablosu (eğer istenmişse)
  if (defaultSettings.showProductProperties) {
    const propertiesData: any[] = [];
    
    items.forEach(item => {
      if (item.products?.product_properties && item.products.product_properties.length > 0) {
        const properties = item.products.product_properties
          .filter((prop: any) => prop.show_in_quotation)
          .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
        
        if (properties.length > 0) {
          // Ürün başlığı
          propertiesData.push([
            { content: item.products.name, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
          ]);
          
          // Ürün özellikleri
          properties.forEach((prop: any) => {
            propertiesData.push([
              prop.property_name,
              prop.property_value
            ]);
          });
          
          // Boş satır ayırıcı
          propertiesData.push([{ content: '', colSpan: 2, styles: { minCellHeight: 5 } }]);
        }
      }
    });
    
    if (propertiesData.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ÜRÜN ÖZELLİKLERİ', 20, currentY);
      currentY += 10;
      
      autoTable(doc, {
        head: [['Özellik', 'Değer']],
        body: propertiesData,
        startY: currentY,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          font: 'helvetica',
        },
        headStyles: {
          fillColor: hexToRgb(defaultSettings.headerColor),
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 60, fontStyle: 'bold' },
          1: { cellWidth: 120 },
        },
        margin: { left: 20, right: 20 },
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }
  }
  
  // Total
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOPLAM: ${formatPrice(quotation.total_amount, quotation.currency)}`, 190, currentY, { align: 'right' });
  
  // Notes
  if (quotation.notes) {
    currentY += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Notlar:', 20, currentY);
    currentY += 8;
    
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(quotation.notes, 170);
    doc.text(splitNotes, 20, currentY);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(defaultSettings.customFooterText, 105, pageHeight - 20, { align: 'center' });
  
  // Save PDF
  const fileName = `Teklif_${quotation.quotation_number.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(fileName);
};

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
  }).format(price);
};

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [66, 139, 202]; // Default blue color
};
