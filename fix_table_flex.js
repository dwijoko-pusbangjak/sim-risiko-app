const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/units/page.tsx', 'utf-8');

c = c.replace(/<TableCell className="font-medium flex items-center gap-2">\s*<Building2 className="([^"]+)" \/>\s*([^<]+)\s*<\/TableCell>/g, 
  `<TableCell className="font-medium">\n<div className="flex items-start gap-2">\n<Building2 className="$1 shrink-0 mt-0.5" />\n<span className="whitespace-normal break-words max-w-[400px]">$2</span>\n</div>\n</TableCell>`);

c = c.replace(/<TableCell className="font-bold flex items-center gap-2 text-slate-800">\s*<Building2 className="([^"]+)" \/>\s*(\{e1\.name\})\s*<\/TableCell>/g, 
  `<TableCell className="font-bold text-slate-800">\n<div className="flex items-start gap-2">\n<Building2 className="$1 shrink-0 mt-0.5" />\n<span className="whitespace-normal break-words max-w-[400px]">$2</span>\n</div>\n</TableCell>`);

c = c.replace(/<TableCell className="font-medium flex items-center gap-2 pl-8 text-slate-600">\s*<CornerDownRight className="([^"]+)" \/>\s*(\{e2\.name\})\s*<\/TableCell>/g, 
  `<TableCell className="font-medium pl-8 text-slate-600">\n<div className="flex items-start gap-2">\n<CornerDownRight className="$1 shrink-0 mt-0.5" />\n<span className="whitespace-normal break-words max-w-[400px]">$2</span>\n</div>\n</TableCell>`);

fs.writeFileSync('src/app/dashboard/units/page.tsx', c);
