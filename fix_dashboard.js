const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf-8');

c = c.replace(/<TableCell className="font-bold text-slate-800 flex items-center py-4">\s*(\{isOpen \?\s*\(\s*<ChevronDown className="h-4 w-4 mr-2 text-slate-500 shrink-0" \/>\s*\)\s*:\s*\(\s*<ChevronRight className="h-4 w-4 mr-2 text-slate-500 shrink-0" \/>\s*\)\s*\})\s*<span className="truncate">(\{e1\.name\})<\/span>\s*<\/TableCell>/g,
  `<TableCell className="font-bold text-slate-800 py-4">\n<div className="flex items-start gap-2 mt-0.5">\n$1\n<span className="whitespace-normal break-words max-w-[400px]">$2</span>\n</div>\n</TableCell>`);

fs.writeFileSync('src/app/dashboard/page.tsx', c);
