const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/users/page.tsx', 'utf-8');

c = c.replace(/<TableCell className="font-medium flex items-center gap-2">\s*(\{u\.role === "admin" \? <ShieldCheck className="w-4 h-4 text-purple-600" \/> : <KeyRound className="w-4 h-4 text-slate-400" \/>\})\s*(\{u\.email\})\s*<\/TableCell>/g,
  `<TableCell className="font-medium">\n<div className="flex items-start gap-2 mt-0.5">\n$1\n<span className="whitespace-normal break-words max-w-[300px]">$2</span>\n</div>\n</TableCell>`);

fs.writeFileSync('src/app/dashboard/users/page.tsx', c);
