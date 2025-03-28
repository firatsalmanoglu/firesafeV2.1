'use client';
import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ActionButtonsProps {
  offerId: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ offerId }) => {
  // PDF indirme fonksiyonu
  const handleDownloadPDF = async () => {
    const element = document.getElementById('offer-document');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 genişliği (mm)
      const pageHeight = 297; // A4 yüksekliği (mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Çok sayfalı belge için
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Teklif-${offerId}.pdf`);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu.');
    }
  };

  // Yazdırma fonksiyonu - geliştirilmiş
  const handlePrint = () => {
    // Doğrudan yazdırma işlemi için en basit yöntem
    const element = document.getElementById('offer-document');
    if (!element) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Lütfen popup engelleyiciyi devre dışı bırakın ve tekrar deneyin.');
      return;
    }
    
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Teklif Dokümanı</title>
          <style>
            /* Genel biçimlendirme */
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body { 
              font-family: Arial, sans-serif; 
              padding: 20mm;
              color: #333;
              line-height: 1.4;
            }
            
            /* Antet bölümü */
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #ddd;
              padding-bottom: 15px;
              margin-bottom: 20px;
              width: 100%;
            }
            
            .company-info {
              flex: 1;
              text-align: left;
            }
            
            .offer-info {
              flex: 1;
              text-align: right;
            }
            
            /* Başlık stilleri */
            h1 {
              color: #2563eb;
              font-size: 26px;
              margin-bottom: 8px;
            }
            
            h2 {
              font-size: 20px;
              margin-bottom: 8px;
              color: #333;
            }
            
            h3 {
              font-size: 16px;
              margin-bottom: 10px;
              font-weight: 600;
            }
            
            /* İçerik bölümleri */
            .section {
              margin-bottom: 20px;
            }
            
            p {
              margin-bottom: 5px;
            }
            
            /* Tablo biçimlendirme */
            table { 
              width: 100%; 
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            th { 
              background-color: #f2f2f2; 
              border: 1px solid #ddd; 
              padding: 8px;
              text-align: left;
            }
            
            td { 
              border: 1px solid #ddd; 
              padding: 8px;
            }
            
            .text-right {
              text-align: right;
            }
            
            /* İmza alanı */
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              display: flex;
              justify-content: space-between;
            }
            
            .notes {
              flex: 1;
            }
            
            .signature {
              flex: 1;
              text-align: right;
            }
            
            .signature-line {
              margin-top: 20px;
              border-top: 2px solid #ddd;
              padding-top: 5px;
              width: 200px;
              text-align: center;
              margin-left: auto;
            }
            
            ul {
              margin-top: 8px;
              margin-left: 20px;
            }
            
            /* Yazdırma ayarları */
            @media print {
              body { 
                margin: 0;
                padding: 15mm;
              }
            }
          </style>
        </head>
        <body>
          ${element.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() { 
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <>
      <button 
        onClick={handleDownloadPDF}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-1"
      >
        <img src="/download.png" alt="" width={16} height={16} />
        PDF İndir
      </button>
      <button 
        onClick={handlePrint}
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-1"
      >
        <img src="/print.png" alt="" width={16} height={16} />
        Yazdır
      </button>
    </>
  );
};

export default ActionButtons;