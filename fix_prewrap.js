const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/mr-konteks/page.tsx', 'utf8');
c = c.replace('<TableCell className="text-slate-600">{item.sumberData}</TableCell>', 
              '<TableCell className="text-slate-600 whitespace-pre-wrap">{item.sumberData}</TableCell>');
fs.writeFileSync('src/app/dashboard/mr-konteks/page.tsx', c);
