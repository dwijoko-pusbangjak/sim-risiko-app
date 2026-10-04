const fs = require('fs');

let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

c = c.replace(
  '<aside className="hidden w-72 flex-col border-r border-slate-800 bg-[#0f172a] md:flex shrink-0">',
  '<aside className="hidden w-72 flex-col border-r border-slate-800 bg-[#0f172a] md:flex shrink-0 print:hidden">'
);

c = c.replace(
  '<header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6 shrink-0 shadow-sm shadow-slate-100/50">',
  '<header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6 shrink-0 shadow-sm shadow-slate-100/50 print:hidden">'
);

c = c.replace(
  '<main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8fafc] relative">',
  '<main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8fafc] relative print:overflow-visible print:bg-white print:p-0 print:m-0">'
);

c = c.replace(
  '<div className="mx-auto max-w-7xl">',
  '<div className="mx-auto max-w-7xl print:max-w-none print:w-full">'
)

fs.writeFileSync('src/app/dashboard/layout.tsx', c);
console.log('Modified layout.tsx for print');
