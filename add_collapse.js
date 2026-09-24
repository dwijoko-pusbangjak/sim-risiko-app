const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/units/page.tsx', 'utf-8');

c = c.replace('import { Plus, Search, Loader2, Pencil, Trash2, Building2, CornerDownRight } from "lucide-react";', 
              'import { Plus, Search, Loader2, Pencil, Trash2, Building2, CornerDownRight, ChevronRight, ChevronDown } from "lucide-react";');

if (!c.includes('const [expandedUnits')) {
  c = c.replace('const [searchTerm, setSearchTerm] = useState("");', 
                'const [searchTerm, setSearchTerm] = useState("");\n    const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});\n    const toggleExpand = (id: string, e: React.MouseEvent) => {\n      // Hanya jika bukan klik di tombol edit/hapus\n      if ((e.target as HTMLElement).closest("button")) return;\n      setExpandedUnits(prev => ({ ...prev, [id]: !prev[id] }));\n    };');
}

const e1BlockStart = `<TableRow key={e1.id} className="bg-slate-50/50 hover:bg-slate-50 border-b-2">
                          <TableCell className="font-bold text-slate-800">
  <div className="flex items-start gap-2">
  <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />`;

const e1BlockEnd = `<TableRow key={e1.id} className="bg-slate-50/50 hover:bg-slate-50 border-b-2 cursor-pointer" onClick={(e) => toggleExpand(e1.id, e)}>
                          <TableCell className="font-bold text-slate-800">
  <div className="flex items-start gap-2">
  {expandedUnits[e1.id] ? <ChevronDown className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" /> : <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />}
  <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />`;

c = c.replace(e1BlockStart, e1BlockEnd);

const childrenBlockStart = `// Cari anak (Eselon 2)
                    const children = units.filter(u => u.level === 'eselon_2' && u.parentId === e1.id);
                    children.forEach(e2 => {`;

const childrenBlockEnd = `// Cari anak (Eselon 2)
                    if (expandedUnits[e1.id]) {
                      const children = units.filter(u => u.level === 'eselon_2' && u.parentId === e1.id);
                      children.forEach(e2 => {`;

c = c.replace(childrenBlockStart, childrenBlockEnd);

const forEachEnd = `</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  });`;

const forEachEndRepl = `</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                    }
                  });`;
                  
c = c.replace(forEachEnd, forEachEndRepl);

fs.writeFileSync('src/app/dashboard/units/page.tsx', c);
