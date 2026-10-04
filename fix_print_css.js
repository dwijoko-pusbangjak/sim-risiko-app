const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf8');

// 1. Fix the main container overflow
c = c.replace(
  '<div className="space-y-6 max-w-full overflow-hidden">',
  '<div className="space-y-6 max-w-full overflow-hidden print:overflow-visible print:max-w-none">'
);

// 2. Replace the style block
const oldStyle = `<style dangerouslySetInnerHTML={{__html: \`
          @media print {
            /* Sembunyikan SEMUA elemen body secara default */
            body * {
              visibility: hidden;
            }
            
            /* Sembunyikan spesifik class UI yang tidak diperlukan di DOM */
            aside, header, .no-print, .print\\\\:hidden {
              display: none !important;
            }
  
            /* Tampilkan HANYA kontainer print-area beserta seluruh isi dalamnya */
            #print-area, #print-area * {
              visibility: visible;
            }
            
            /* Tarik print area ke pojok kiri atas menutupi semua padding/margin layout */
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100vw;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
  
            /* Pastikan tidak ada halaman kosong akibat scroll container Next.js */
            html, body {
              overflow: visible !important;
              height: auto !important;
              min-height: 100vh;
            }
            
            /* Custom table printing rules to avoid page break inside rows */
            tr {
              page-break-inside: avoid;
            }
            thead {
              display: table-header-group;
            }
            
            @page {
              size: landscape;
              margin: 1.5cm;
            }
          }
        \`}} />`;

const newStyle = `<style dangerouslySetInnerHTML={{__html: \`
          @media print {
            .no-print, .print\\\\:hidden {
              display: none !important;
            }
            html, body {
              overflow: visible !important;
              height: auto !important;
              min-height: auto !important;
            }
            #print-area {
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              width: 100% !important;
            }
            table {
              page-break-inside: auto;
              width: 100% !important;
              table-layout: auto !important;
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
            @page {
              size: landscape;
              margin: 10mm;
            }
          }
        \`}} />`;

// Fallback regex if the exact string match fails due to backslashes
if (c.includes(oldStyle)) {
  c = c.replace(oldStyle, newStyle);
} else {
  // Regex replacement for the style block
  const styleRegex = /<style dangerouslySetInnerHTML=\{\{__html: `\s*@media print \{[\s\S]*?\bmargin: 1\.5cm;\s*\}\s*\}\s*`\}\} \/>/;
  c = c.replace(styleRegex, newStyle);
}

fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
console.log('Modified laporan print css');
