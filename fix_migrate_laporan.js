const fs = require('fs');
let c = fs.readFileSync('migrate_laporan.js', 'utf-8');
c = c.replace(/\\\\'text\/csv/g, "\\'text/csv");
c = c.replace(/8;\\\\'/g, "8;\\'");
fs.writeFileSync('migrate_laporan.js', c);
