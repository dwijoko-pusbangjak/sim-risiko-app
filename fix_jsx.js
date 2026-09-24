const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf-8');
c = c.replace(/\\\\n/g, '\\n');
c = c.replace(/\\\\\`/g, '`');
c = c.replace(/\\\\\$/g, '$');
fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
