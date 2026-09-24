const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/units/page.tsx', 'utf-8');

c = c.replace('import { Plus, Search, Loader2, Pencil, Trash2, Building2, CornerDownRight } from "lucide-react";', 
              'import { Plus, Search, Loader2, Pencil, Trash2, Building2, CornerDownRight, ChevronRight, ChevronDown } from "lucide-react";');

if (!c.includes('const [expandedUnits')) {
  c = c.replace('const [searchTerm, setSearchTerm] = useState("");', 
                'const [searchTerm, setSearchTerm] = useState("");\n    const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});\n    const toggleExpand = (id: string, e: React.MouseEvent) => {\n      if ((e.target as HTMLElement).closest("button")) return;\n      setExpandedUnits(prev => ({ ...prev, [id]: !prev[id] }));\n    };');
}

c = c.replace(/<TableRow key=\{e1\.id\} className=\"bg-slate-50\/50 hover:bg-slate-50 border-b-2\">\s*<TableCell className=\"font-bold flex items-center gap-2 text-slate-800\">\s*<Building2 className=\"w-4 h-4 text-emerald-600\" \/>\s*\{e1\.name\}\s*<\/TableCell>/g,
  `<TableRow key={e1.id} className="bg-slate-50/50 hover:bg-slate-50 border-b-2 cursor-pointer" onClick={(e) => toggleExpand(e1.id, e)}>\n<TableCell className="font-bold text-slate-800">\n<div className="flex items-start gap-2">\n{expandedUnits[e1.id] ? <ChevronDown className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" /> : <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />}\n<Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />\n<span className="whitespace-normal break-words max-w-[400px]">{e1.name}</span>\n</div>\n</TableCell>`);

c = c.replace(/<TableCell className="font-medium flex items-center gap-2">\s*<Building2 className="([^"]+)" \/>\s*([^<]+)\s*<\/TableCell>/g, 
  `<TableCell className="font-medium">\n<div className="flex items-start gap-2">\n<Building2 className="$1 shrink-0 mt-0.5" />\n<span className="whitespace-normal break-words max-w-[400px]">$2</span>\n</div>\n</TableCell>`);

c = c.replace(/<TableCell className="font-medium flex items-center gap-2 pl-8 text-slate-600">\s*<CornerDownRight className="([^"]+)" \/>\s*(\{e2\.name\})\s*<\/TableCell>/g, 
  `<TableCell className="font-medium pl-8 text-slate-600">\n<div className="flex items-start gap-2">\n<CornerDownRight className="$1 shrink-0 mt-0.5" />\n<span className="whitespace-normal break-words max-w-[400px]">$2</span>\n</div>\n</TableCell>`);

c = c.replace(/\/\/ Cari anak \(Eselon 2\)\n\s*const children = units\.filter\(u => u\.level === 'eselon_2' && u\.parentId === e1\.id\);\n\s*children\.forEach\(e2 => \{/, 
  `// Cari anak (Eselon 2)
                    if (expandedUnits[e1.id]) {
                      const children = units.filter(u => u.level === 'eselon_2' && u.parentId === e1.id);
                      children.forEach(e2 => {`);

c = c.replace(/}\);\n\s*}\);\n\s*}/g, 
  `});\n                    }\n                  });\n                }`);

fs.writeFileSync('src/app/dashboard/units/page.tsx', c);
