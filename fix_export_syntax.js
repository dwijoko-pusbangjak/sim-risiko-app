const fs = require('fs');
let c = fs.readFileSync('src/lib/exportExcel.ts', 'utf8');

c = c.replace(/\\\`\+\\\$\{e\.deviasi\}\\\`/g, '`+${e.deviasi}`');
c = c.replace(/\\`/g, '`');
c = c.replace(/\\\$/g, '$');
c = c.replace(/\\n/g, '\n');

fs.writeFileSync('src/lib/exportExcel.ts', c);
