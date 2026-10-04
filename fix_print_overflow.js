const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf8');

c = c.replace(
  'id="print-area" className="bg-white border-2 border-slate-200 print:border-none p-8 md:p-12 min-h-[297mm] shadow-lg print:shadow-none print:p-0"',
  'id="print-area" className="bg-white border-2 border-slate-200 print:border-none p-8 md:p-12 min-h-[297mm] shadow-lg print:shadow-none print:p-0 overflow-x-auto print:overflow-visible"'
);

const newStyle = `            table {
              page-break-inside: auto;
              width: 100% !important;
              max-width: 100% !important;
              table-layout: fixed !important; /* Force columns to fit within 100% */
            }
            th, td {
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              white-space: normal !important;
            }`;

c = c.replace(
  `            table {
              page-break-inside: auto;
              width: 100% !important;
              table-layout: auto !important;
            }`,
  newStyle
);

// We should also set standard styling for the table in print via CSS
c = c.replace(
  `            thead {
              display: table-header-group;
            }`,
  `            thead {
              display: table-header-group;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
               /* Skala khusus saat print agar tabel muat */
               zoom: 0.8;
            }`
);

fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
console.log('Modified wrapper and print scale');
