const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf-8');
c = c.replace('{/* FOOTER TANDA', '</div>\n\n          {/* FOOTER TANDA');
fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
