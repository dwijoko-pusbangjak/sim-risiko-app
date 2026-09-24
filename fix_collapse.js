const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/units/page.tsx', 'utf-8');

const target1 = `<TableRow key={e1.id} className="bg-slate-50/50 hover:bg-slate-50 border-b-2">
                        <TableCell className="font-bold text-slate-800">
<div className="flex items-start gap-2">
<Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />`;

const replacement1 = `<TableRow key={e1.id} className="bg-slate-50/50 hover:bg-slate-50 border-b-2 cursor-pointer" onClick={(e) => toggleExpand(e1.id, e)}>
                        <TableCell className="font-bold text-slate-800">
<div className="flex items-start gap-2">
{expandedUnits[e1.id] ? <ChevronDown className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" /> : <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />}
<Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />`;

c = c.replace(target1, replacement1);

const target2 = `// Cari anak (Eselon 2)
                    const children = units.filter(u => u.level === 'eselon_2' && u.parentId === e1.id);
                    children.forEach(e2 => {`;

const replacement2 = `// Cari anak (Eselon 2)
                    if (expandedUnits[e1.id]) {
                      const children = units.filter(u => u.level === 'eselon_2' && u.parentId === e1.id);
                      children.forEach(e2 => {`;

c = c.replace(target2, replacement2);

const target3 = `                          </TableCell>
                        </TableRow>
                      );
                    });
                  });
                }`;

const replacement3 = `                          </TableCell>
                        </TableRow>
                      );
                    });
                    }
                  });
                }`;

c = c.replace(target3, replacement3);

fs.writeFileSync('src/app/dashboard/units/page.tsx', c);
