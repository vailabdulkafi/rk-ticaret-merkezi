
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QuotationPdfData {
  quotation: any;
  items: any[];
  company: any;
}

export const generateQuotationPdf = async (data: QuotationPdfData) => {
  const { quotation, items, company } = data;
  
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('FİYAT TEKLİFİ', 105, 20, { align: 'center' });
  
  // Quotation Info
  doc.setFontSize(12);
  doc.text(`Teklif No: ${quotation.quotation_number}`, 20, 40);
  doc.text(`Tarih: ${new Date(quotation.quotation_date).toLocaleDateString('tr-TR')}`, 20, 50);
  doc.text(`Geçerlilik: ${quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('tr-TR') : '-'}`, 20, 60);
  
  // Company Info
  doc.text(`Firma: ${company?.name || '-'}`, 120, 40);
  doc.text(`İletişim: ${company?.contact_person || '-'}`, 120, 50);
  doc.text(`Telefon: ${company?.phone || '-'}`, 120, 60);
  doc.text(`E-posta: ${company?.email || '-'}`, 120, 70);
  
  // Line separator
  doc.line(20, 80, 190, 80);
  
  // Items table
  const tableData = items.map(item => [
    item.products?.name || '-',
    item.products?.brand || '-',
    item.products?.model || '-',
    item.quantity.toString(),
    formatPrice(item.unit_price, quotation.currency),
    item.discount_percentage ? `${item.discount_percentage}%` : '0%',
    formatPrice(item.total_price, quotation.currency),
    getProductProperties(item.products?.product_properties)
  ]);
  
  autoTable(doc, {
    head: [['Ürün Adı', 'Marka', 'Model', 'Miktar', 'Birim Fiyat', 'İndirim', 'Toplam', 'Özellikler']],
    body: tableData,
    startY: 90,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 15 },
      4: { cellWidth: 25 },
      5: { cellWidth: 15 },
      6: { cellWidth: 25 },
      7: { cellWidth: 45 },
    },
    didParseCell: function(data: any) {
      if (data.column.index === 7) { // Özellikler sütunu
        data.cell.styles.fontSize = 7;
      }
    }
  });
  
  // Total
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(`TOPLAM: ${formatPrice(quotation.total_amount, quotation.currency)}`, 190, finalY, { align: 'right' });
  
  // Notes
  if (quotation.notes) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Notlar:', 20, finalY + 20);
    const splitNotes = doc.splitTextToSize(quotation.notes, 170);
    doc.text(splitNotes, 20, finalY + 30);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text('Bu teklif elektronik ortamda oluşturulmuştur. Resmi onay için yetkili imzası gereklidir.', 
    105, pageHeight - 20, { align: 'center' });
  
  // Save PDF
  doc.save(`Teklif_${quotation.quotation_number}.pdf`);
};

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
  }).format(price);
};

const getProductProperties = (properties: any[]) => {
  if (!properties || properties.length === 0) return '-';
  
  return properties
    .filter(prop => prop.show_in_quotation)
    .map(prop => `${prop.property_name}: ${prop.property_value}`)
    .join('\n');
};
