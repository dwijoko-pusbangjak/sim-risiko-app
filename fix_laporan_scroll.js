const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf8');

// Update the top wrapper
c = c.replace(
  '<div className="space-y-6 max-w-full overflow-hidden print:overflow-visible print:max-w-none">',
  '<div className="flex flex-col h-full space-y-4 max-w-full overflow-hidden print:overflow-visible print:max-w-none print:h-auto print:block">'
);

// We need to wrap the #print-area in a flex-1 container to allow it to grow and scroll internally
// Wait, actually, if #print-area is the container itself, we can just give it `flex-1 min-h-0 overflow-auto`.
// But it has `print:min-h-[297mm]`.
c = c.replace(
  /className="bg-white border-2 border-slate-200 print:border-none p-8 md:p-12 min-h-\[500px\] max-h-\[75vh\] print:min-h-\[297mm\] print:max-h-none shadow-lg print:shadow-none print:p-0 overflow-auto print:overflow-visible custom-scrollbar"/g,
  'className="flex-1 min-h-0 overflow-auto bg-white border-2 border-slate-200 print:border-none p-8 md:p-12 print:min-h-[297mm] shadow-lg print:shadow-none print:p-0 print:overflow-visible custom-scrollbar"'
);

// We also need to make sure the header/filters shrink-0
c = c.replace(
  '<div className="print:hidden space-y-6 no-print">',
  '<div className="print:hidden space-y-4 no-print shrink-0">'
);

fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
console.log('Fixed flex layout for laporan preview');
