const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

c = c.replace(
  /let totalRisiko = e1Risks\.length;\s*let risikoPrioritas = e1Risks\.filter\(r => \(r\.besaranRisiko \|\| 0\) >= 12\)\.length;\s*let totalRtp = e1Risks\.reduce\(\(acc, r\) => acc \+ \(r\.rtpList\?\.length \|\| 0\), 0\);/,
  `const e1OwnTotalRisiko = e1Risks.length;
        const e1OwnRisikoPrioritas = e1Risks.filter(r => (r.besaranRisiko || 0) >= 12).length;
        const e1OwnTotalRtp = e1Risks.reduce((acc, r) => acc + (r.rtpList?.length || 0), 0);
        
        let totalRisiko = e1OwnTotalRisiko;
        let risikoPrioritas = e1OwnRisikoPrioritas;
        let totalRtp = e1OwnTotalRtp;`
);

c = c.replace(
  /return \{\s*\.\.\.e1,\s*totalRisiko,\s*risikoPrioritas,\s*totalRtp,\s*children: childrenData\s*\};/,
  `return {
          ...e1,
          totalRisiko,
          risikoPrioritas,
          totalRtp,
          e1OwnTotalRisiko,
          e1OwnRisikoPrioritas,
          e1OwnTotalRtp,
          children: childrenData
        };`
);

const renderOld = `{/* Rows Eselon 2 (Children) */}
                          {isOpen && e1.children.map((e2: any) => (`;
const renderNew = `{/* Rows Eselon 2 (Children) */}
                          {isOpen && (
                            <>
                              <TableRow className="bg-slate-50/30 hover:bg-slate-50 transition-colors">
                                <TableCell className="pl-12 py-3 text-emerald-700 font-semibold relative before:absolute before:left-[1.35rem] before:top-0 before:bottom-0 before:w-px before:bg-slate-200">
                                  <div className="absolute left-[1.35rem] top-1/2 -translate-y-1/2 w-3 h-px bg-slate-200"></div>
                                  <span className="truncate block pr-4">Internal {e1.name}</span>
                                </TableCell>
                                <TableCell className="text-center font-semibold text-emerald-700">{e1.e1OwnTotalRisiko}</TableCell>
                                <TableCell className="text-center font-semibold text-emerald-700">{e1.e1OwnRisikoPrioritas}</TableCell>
                                <TableCell className="text-center font-semibold text-emerald-700">{e1.e1OwnTotalRtp}</TableCell>
                              </TableRow>
                              {e1.children.map((e2: any) => (`;

c = c.replace(renderOld, renderNew);
c = c.replace(/e1\.children\.map\(\(e2: any\) => \(\s*<TableRow key=\{e2\.id\}/, `e1.children.map((e2: any) => (\n                                <TableRow key={e2.id}`);
c = c.replace(/<\/TableRow>\s*\)\)\s*\}/, `</TableRow>\n                              ))}\n                            </>\n                          )}`);


fs.writeFileSync('src/app/dashboard/page.tsx', c);
console.log('Modified page.tsx');
