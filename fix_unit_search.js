const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/units/page.tsx', 'utf-8');

c = c.replace(/<TableCell className="font-medium flex items-center gap-2">\s*<Building2 className=\{`w-4 h-4 \$\{u\.level === 'eselon_1' \? 'text-emerald-600' : 'text-slate-400'\}`\} \/>\s*\{u\.name\}\s*<\/TableCell>/g,
  `<TableCell className="font-medium">\n<div className="flex items-start gap-2">\n<Building2 className={\`w-4 h-4 mt-0.5 shrink-0 \${u.level === 'eselon_1' ? 'text-emerald-600' : 'text-slate-400'}\`} />\n<span className="whitespace-normal break-words max-w-[400px]">{u.name}</span>\n</div>\n</TableCell>`);

fs.writeFileSync('src/app/dashboard/units/page.tsx', c);
