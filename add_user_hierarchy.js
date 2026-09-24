const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/users/page.tsx', 'utf-8');

// 1. Add imports
c = c.replace('import { Plus, Search, Loader2, ShieldCheck, KeyRound, Pencil, Trash2, Mail } from "lucide-react";',
              'import { Plus, Search, Loader2, ShieldCheck, KeyRound, Pencil, Trash2, Mail, Building2, CornerDownRight, ChevronRight, ChevronDown } from "lucide-react";');

// 2. Add state
if (!c.includes('const [expandedUnits')) {
  c = c.replace('const [searchTerm, setSearchTerm] = useState("");',
                'const [searchTerm, setSearchTerm] = useState("");\n  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});\n  const toggleExpand = (id: string, e: React.MouseEvent) => {\n    if ((e.target as HTMLElement).closest("button")) return;\n    setExpandedUnits(prev => ({ ...prev, [id]: !prev[id] }));\n  };');
}

// 3. Replace TableBody logic
const tableBodyStart = c.indexOf('filteredUsers.map((u) => (');
const tableBodyEnd = c.indexOf('))', tableBodyStart) + 2;

if (tableBodyStart !== -1 && tableBodyEnd !== -1) {
  const replacement = `(() => {
                const rows: React.ReactNode[] = [];
                
                const renderUserRow = (u: any, indentClass: string) => (
                  <TableRow key={u.id} className={indentClass.includes('bg-') ? indentClass.split(' ').find(cls => cls.startsWith('bg-')) : ''}>
                    <TableCell className={\`font-medium \${indentClass.replace(/bg-[^\\s]+/g, '')}\`}>
                      <div className="flex items-start gap-2 mt-0.5">
                        {u.role === "admin" ? <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" /> : <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />}
                        <span className="whitespace-normal break-words max-w-[300px]">{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell><span className="whitespace-normal break-words max-w-[400px] block">{u.unitName}</span></TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(u)} title="Edit Akses & Unit">
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleResetPassword(u.email)} title="Kirim Reset Password">
                          <Mail className="h-4 w-4 text-amber-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id, u.email)} title="Hapus Akses">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );

                if (searchTerm) {
                  filteredUsers.forEach(u => rows.push(renderUserRow(u, "")));
                } else {
                  // Admin / Kementerian (No Eselon 1 Parent)
                  const admins = filteredUsers.filter(u => u.role === "admin" || u.role === "kementerian" || !u.unitId || u.unitId === "none");
                  admins.forEach(u => rows.push(renderUserRow(u, "")));
                  
                  const eselon1Units = unitsList.filter(u => u.level === 'eselon_1');
                  eselon1Units.forEach(e1 => {
                    // Check if there are any users in this E1 or its E2 children
                    const e1Users = filteredUsers.filter(u => u.unitId === e1.id);
                    const e2Units = unitsList.filter(u => u.level === 'eselon_2' && u.parentId === e1.id);
                    const e2UserCount = filteredUsers.filter(u => e2Units.some(e2 => e2.id === u.unitId)).length;
                    
                    if (e1Users.length > 0 || e2UserCount > 0) {
                      rows.push(
                        <TableRow key={e1.id} className="bg-slate-50/50 hover:bg-slate-50 border-b-2 cursor-pointer" onClick={(e) => toggleExpand(e1.id, e)}>
                          <TableCell colSpan={4} className="font-bold text-slate-800">
                            <div className="flex items-start gap-2">
                              {expandedUnits[e1.id] ? <ChevronDown className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" /> : <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />}
                              <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="whitespace-normal break-words max-w-[600px]">{e1.name}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                      
                      if (expandedUnits[e1.id]) {
                        e1Users.forEach(u => rows.push(renderUserRow(u, "pl-8 bg-slate-50/30")));
                        
                        e2Units.forEach(e2 => {
                          const e2Users = filteredUsers.filter(u => u.unitId === e2.id);
                          if (e2Users.length > 0) {
                            rows.push(
                              <TableRow key={e2.id} className="bg-slate-50 hover:bg-slate-100 cursor-pointer border-t border-slate-100" onClick={(e) => toggleExpand(e2.id, e)}>
                                <TableCell colSpan={4} className="font-semibold text-slate-700 pl-8">
                                  <div className="flex items-start gap-2">
                                    {expandedUnits[e2.id] ? <ChevronDown className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" /> : <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />}
                                    <CornerDownRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    <span className="whitespace-normal break-words max-w-[600px]">{e2.name}</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                            
                            if (expandedUnits[e2.id]) {
                              e2Users.forEach(u => rows.push(renderUserRow(u, "pl-14 bg-slate-50/70")));
                            }
                          }
                        });
                      }
                    }
                  });
                  
                  // Users that belong to units that are not E1 or E2, or unknown
                  const matchedUserIds = new Set([
                    ...admins.map(u => u.id),
                    ...eselon1Units.flatMap(e1 => filteredUsers.filter(u => u.unitId === e1.id).map(u => u.id)),
                    ...unitsList.filter(u => u.level === 'eselon_2').flatMap(e2 => filteredUsers.filter(u => u.unitId === e2.id).map(u => u.id))
                  ]);
                  
                  const orphanedUsers = filteredUsers.filter(u => !matchedUserIds.has(u.id));
                  if (orphanedUsers.length > 0) {
                    rows.push(
                      <TableRow key="orphaned-group" className="bg-orange-50/50">
                        <TableCell colSpan={4} className="font-bold text-orange-800">
                          Lainnya (Unit Kerja Tidak Dikenal/Terhapus)
                        </TableCell>
                      </TableRow>
                    );
                    orphanedUsers.forEach(u => rows.push(renderUserRow(u, "pl-8 bg-orange-50/30")));
                  }
                }
                return rows;
              })()`;
  
  c = c.substring(0, tableBodyStart) + replacement + c.substring(tableBodyEnd);
} else {
  console.log('tablebody not found');
}

fs.writeFileSync('src/app/dashboard/users/page.tsx', c);
