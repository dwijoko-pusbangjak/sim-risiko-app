const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/units/page.tsx', 'utf-8');

// Replace 1: Eselon 1 Row
const p1a = c.indexOf('<TableRow key={e1.id} className="bg-slate-50/50 hover:bg-slate-50 border-b-2">');
const p1b = c.indexOf('<Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />', p1a);
if (p1a !== -1 && p1b !== -1) {
  let part = c.substring(p1a, p1b);
  part = part.replace('<TableRow key={e1.id} className="bg-slate-50/50 hover:bg-slate-50 border-b-2">', '<TableRow key={e1.id} className="bg-slate-50/50 hover:bg-slate-50 border-b-2 cursor-pointer" onClick={(e) => toggleExpand(e1.id, e)}>');
  part = part + '{expandedUnits[e1.id] ? <ChevronDown className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" /> : <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />}\n';
  c = c.substring(0, p1a) + part + c.substring(p1b);
} else { console.log('p1 failed'); }

// Replace 2: Children IF
const p2a = c.indexOf('const children = units.filter(u => u.level === \\'eselon_2\\' && u.parentId === e1.id);');
if (p2a !== -1) {
  c = c.substring(0, p2a) + 'if (expandedUnits[e1.id]) {\n                      ' + c.substring(p2a);
} else { console.log('p2 failed'); }

// Replace 3: Children END
const p3a = c.indexOf('});\n                  });\n                }\n                return rows;');
if (p3a !== -1) {
  c = c.substring(0, p3a) + '});\n                    }\n                  });\n                }\n                return rows;';
} else {
  // Try with \r\n
  const p3b = c.indexOf('});\r\n                  });\r\n                }\r\n                return rows;');
  if (p3b !== -1) {
    c = c.substring(0, p3b) + '});\r\n                    }\r\n                  });\r\n                }\r\n                return rows;';
  } else {
    console.log('p3 failed');
  }
}

fs.writeFileSync('src/app/dashboard/units/page.tsx', c);
