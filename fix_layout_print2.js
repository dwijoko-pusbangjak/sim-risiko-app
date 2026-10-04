const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

c = c.replace(
  '<div className="flex h-screen overflow-hidden bg-slate-50">',
  '<div className="flex h-screen overflow-hidden bg-slate-50 print:h-auto print:min-h-0 print:block print:overflow-visible">'
);

c = c.replace(
  '<div className="flex flex-1 flex-col min-w-0 overflow-hidden">',
  '<div className="flex flex-1 flex-col min-w-0 overflow-hidden print:block print:overflow-visible">'
);

fs.writeFileSync('src/app/dashboard/layout.tsx', c);
console.log('Fixed outer containers for print pagination');
