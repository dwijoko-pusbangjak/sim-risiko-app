const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf8');

c = c.replace(
  '<div id="print-area" className="bg-white border-2 border-slate-200 print:border-none p-8 md:p-12 min-h-[297mm] shadow-lg print:shadow-none print:p-0 overflow-x-auto print:overflow-visible"',
  '<div id="print-area" className="bg-white border-2 border-slate-200 print:border-none p-8 md:p-12 min-h-[297mm] max-h-[75vh] print:max-h-none shadow-lg print:shadow-none print:p-0 overflow-auto print:overflow-visible"'
);

fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
console.log('Modified print-area with max-h and overflow-auto');
