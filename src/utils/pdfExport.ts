/**
 * PDF/Döküm export utility
 * Uses browser's print dialog for PDF export
 */

export function exportToPdf(title: string, elementId?: string) {
  // Create a print-friendly version
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up engelleyici nedeniyle yazdırma penceresi açılamadı. Lütfen pop-up engelleyiciyi devre dışı bırakın.');
    return;
  }

  // Get the content to print
  let content: HTMLElement | null = null;
  if (elementId) {
    content = document.getElementById(elementId);
  } else {
    // Find the main report container
    content = document.querySelector('.space-y-4, .card') as HTMLElement;
  }

  if (!content) {
    alert('Yazdırılacak içerik bulunamadı.');
    return;
  }

  // Clone the content to avoid modifying the original
  const clonedContent = content.cloneNode(true) as HTMLElement;

  // Hide no-print elements
  const noPrintElements = clonedContent.querySelectorAll('.no-print');
  noPrintElements.forEach((el) => {
    (el as HTMLElement).style.display = 'none';
  });

  // Create print HTML
  const printHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 1cm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              font-size: 12px;
              color: #000;
            }
            .no-print {
              display: none !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 6px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .card {
              border: 1px solid #ddd;
              padding: 10px;
              margin: 10px 0;
              page-break-inside: avoid;
            }
            h1, h2, h3 {
              page-break-after: avoid;
            }
            tr {
              page-break-inside: avoid;
            }
          }
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 12px;
            color: #000;
          }
          h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .card {
            border: 1px solid #ddd;
            padding: 10px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div style="margin-bottom: 10px; font-size: 10px; color: #666;">
          Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}
        </div>
        ${clonedContent.innerHTML}
      </body>
    </html>
  `;

  printWindow.document.write(printHtml);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Close window after print dialog is closed (optional)
      // printWindow.close();
    }, 250);
  };
}

/**
 * Alternative: Direct print using window.print()
 * This is simpler but less customizable
 */
export function printReport(elementId?: string) {
  // Hide no-print elements temporarily
  const noPrintElements = document.querySelectorAll('.no-print');
  const originalDisplays: string[] = [];
  noPrintElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    originalDisplays.push(htmlEl.style.display);
    htmlEl.style.display = 'none';
  });

  // Add print styles
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      @page {
        size: A4;
        margin: 1cm;
      }
      .no-print {
        display: none !important;
      }
      body {
        font-size: 12px;
      }
      table {
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      thead {
        display: table-header-group;
      }
      tfoot {
        display: table-footer-group;
      }
    }
  `;
  document.head.appendChild(style);

  // Print
  window.print();

  // Restore original displays
  setTimeout(() => {
    noPrintElements.forEach((el, index) => {
      (el as HTMLElement).style.display = originalDisplays[index];
    });
    document.head.removeChild(style);
  }, 100);
}

