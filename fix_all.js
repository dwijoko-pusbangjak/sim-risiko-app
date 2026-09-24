const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf-8');
c = c.replace(/\\`/g, '`');
c = c.replace(/\\\$/g, '$');
c = c.replace(/\\n          <\/div>\\n\\n          \{\/\* FOOTER TANDA TANGAN \*\/\}/g, '\n          </div>\n\n          {/* FOOTER TANDA TANGAN */}');
fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
