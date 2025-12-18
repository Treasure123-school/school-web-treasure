import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
  filename?: string;
  scale?: number;
  backgroundColor?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

export async function exportToImage(
  element: HTMLElement, 
  options: ExportOptions = {}
): Promise<void> {
  const { 
    filename = 'report-card', 
    scale = 2, 
    backgroundColor = '#ffffff' 
  } = options;

  try {
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0';
    clonedElement.style.width = '210mm';
    clonedElement.style.backgroundColor = backgroundColor;
    document.body.appendChild(clonedElement);

    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(clonedElement, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor,
      allowTaint: true,
      foreignObjectRendering: false,
      windowWidth: 794,
      windowHeight: 1123,
    });

    document.body.removeChild(clonedElement);

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  } catch (error) {
    console.error('Failed to export as image:', error);
    throw new Error('Failed to export report card as image. Please try again.');
  }
}

export async function exportToPDF(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const { 
    filename = 'report-card', 
    scale = 2, 
    backgroundColor = '#ffffff',
    format = 'a4',
    orientation = 'portrait'
  } = options;

  try {
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0';
    clonedElement.style.width = '210mm';
    clonedElement.style.backgroundColor = backgroundColor;
    clonedElement.style.padding = '0';
    clonedElement.style.margin = '0';
    document.body.appendChild(clonedElement);

    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(clonedElement, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor,
      allowTaint: true,
      foreignObjectRendering: false,
      windowWidth: 794,
      windowHeight: 1123,
    });

    document.body.removeChild(clonedElement);

    const imgData = canvas.toDataURL('image/png', 1.0);
    
    const pageWidth = format === 'a4' ? 210 : 216;
    const pageHeight = format === 'a4' ? 297 : 279;
    
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format
    });
    
    let heightLeft = imgHeight;
    let position = 0;
    let pageNum = 0;
    
    while (heightLeft > 0) {
      if (pageNum > 0) {
        pdf.addPage();
      }
      
      const yPosition = pageNum === 0 ? 0 : -(pageHeight * pageNum);
      pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight);
      
      heightLeft -= pageHeight;
      pageNum++;
    }
    
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Failed to export as PDF:', error);
    throw new Error('Failed to export report card as PDF. Please try again.');
  }
}

export function printElement(element: HTMLElement): void {
  try {
    const printStyles = `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        html, body {
          width: 210mm;
          height: 297mm;
          margin: 0;
          padding: 0;
          background: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        * {
          box-sizing: border-box;
        }
        .print-container {
          width: 210mm !important;
          min-height: 297mm !important;
          margin: 0 !important;
          padding: 6mm !important;
          background: white !important;
        }
        table {
          border-collapse: collapse !important;
        }
        th, td {
          border: 1px solid #374151 !important;
        }
      }
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      const printContainer = document.createElement('div');
      printContainer.className = 'print-only-container';
      printContainer.innerHTML = element.outerHTML;
      document.body.appendChild(printContainer);
      
      const style = document.createElement('style');
      style.textContent = `
        @media print {
          body > *:not(.print-only-container) { display: none !important; }
          .print-only-container { display: block !important; }
        }
        @media screen {
          .print-only-container { display: none !important; }
        }
      `;
      document.head.appendChild(style);
      
      window.print();
      
      setTimeout(() => {
        document.body.removeChild(printContainer);
        document.head.removeChild(style);
      }, 1000);
      return;
    }

    const fontLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => link.outerHTML)
      .join('\n');

    const inlineStyles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules || [])
            .map(rule => rule.cssText)
            .join('\n');
        } catch {
          return '';
        }
      })
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Report Card</title>
          ${fontLinks}
          <style>
            ${inlineStyles}
            ${printStyles}
          </style>
        </head>
        <body>
          <div class="print-container">
            ${element.outerHTML}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();

    const images = printWindow.document.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      return new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }
      });
    });

    Promise.all(imagePromises).then(() => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 500);
      }, 300);
    });
  } catch (error) {
    console.error('Failed to print:', error);
    window.print();
  }
}

export async function captureReportCardCanvas(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<HTMLCanvasElement> {
  const { 
    scale = 2, 
    backgroundColor = '#ffffff' 
  } = options;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor,
    allowTaint: true,
    foreignObjectRendering: false,
    windowWidth: 794,
    windowHeight: 1123,
  });

  return canvas;
}
