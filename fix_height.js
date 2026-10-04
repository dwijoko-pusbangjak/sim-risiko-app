const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf8');

c = c.replace(
  'className="flex-1 min-h-0 overflow-auto bg-white border-2 border-slate-200 print:border-none p-8 md:p-12 print:min-h-[297mm] shadow-lg print:shadow-none print:p-0 print:overflow-visible custom-scrollbar"',
  'className="h-[55vh] lg:h-[calc(100vh-320px)] overflow-auto bg-white border-2 border-slate-200 print:border-none p-8 md:p-12 print:min-h-[297mm] print:h-auto shadow-lg print:shadow-none print:p-0 print:overflow-visible custom-scrollbar"'
);

// We can also remove the h-full flex flex-col from the wrapper so it doesn't mess with next.js layout
c = c.replace(
  '<div className="flex flex-col h-full space-y-4 max-w-full overflow-hidden print:overflow-visible print:max-w-none print:h-auto print:block">',
  '<div className="space-y-6 max-w-full print:overflow-visible print:max-w-none">'
);

fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
console.log('Fixed height calculation');
