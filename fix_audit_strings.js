const fs = require('fs');

let a = fs.readFileSync('src/app/dashboard/audit/page.tsx', 'utf8');
a = a.replace(/\\\`/g, '`');
a = a.replace(/\\\$/g, '$');
fs.writeFileSync('src/app/dashboard/audit/page.tsx', a);

let k = fs.readFileSync('src/app/dashboard/proses-audit/kirim/page.tsx', 'utf8');
k = k.replace(/\\\`/g, '`');
k = k.replace(/\\\$/g, '$');
fs.writeFileSync('src/app/dashboard/proses-audit/kirim/page.tsx', k);

console.log('Fixed backslashes');
